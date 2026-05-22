"""Stage 4: Timely Filing Agent.

Reads claim's days_aged, state, recv_dt. Generates claim_header_detail record.
Calculates date difference and applies state-specific filing rules.
"""
import json
import random
from datetime import datetime, timedelta
from app.agents.base_agent import call_bedrock, store_stage_output, parse_bedrock_json
from app.db.pool import get_db

STAGE_NUMBER = 4
STAGE_NAME = "Timely Filing Check"
AGENT_NAME = "Timely Filing Agent"

# State-specific timely filing limits (days)
STATE_FILING_LIMITS = {
    "KY": 365,
    "OH": 365,
    "IN": 365,
    "TN": 365,
    "GA": 365,
    "FL": 365,
    "TX": 365,
    "CA": 365,
    "NY": 365,
    "PA": 365,
    "IL": 365,
    "MI": 365,
    "VA": 365,
    "NC": 365,
    "WV": 365,
    "DEFAULT": 365,
}

# Place of service codes
POS_CODES = ["11", "21", "22", "23", "24", "31", "32", "41", "51", "61", "81"]


def run_timely_filing_agent(claim: dict) -> dict:
    """Run timely filing check for a claim."""
    claim_id = claim["id"]
    claim_number = claim.get("claim_number", "")
    days_aged = claim.get("days_aged", 0) or 0
    state = claim.get("state", "OH") or "OH"
    recv_dt = claim.get("recv_dt", "") or ""

    # Try Bedrock for enhanced reasoning
    bedrock_result = _try_bedrock(claim)

    if bedrock_result:
        header_detail = bedrock_result.get("header_detail", {})
        outcome = bedrock_result.get("outcome", "Passed Timely Filing")
        reasoning = bedrock_result.get("reasoning", "")
        confidence = bedrock_result.get("confidence", "High")
        days_remaining = bedrock_result.get("days_remaining", 0)
    else:
        # Deterministic fallback
        header_detail, outcome, reasoning, confidence, days_remaining = _deterministic_logic(claim)

    # Store header detail
    _store_header_detail(claim_id, header_detail)

    # Build output
    filing_limit = STATE_FILING_LIMITS.get(state, STATE_FILING_LIMITS["DEFAULT"])
    output_data = {
        "outcome": outcome,
        "confidence": confidence,
        "reasoning": reasoning,
        "days_aged": days_aged,
        "state": state,
        "filing_limit": filing_limit,
        "days_remaining": days_remaining,
        "received_date": recv_dt,
        "header_detail": header_detail,
        "within_limit": days_aged <= filing_limit,
    }

    # Store stage output
    store_stage_output(
        claim_id, STAGE_NUMBER, STAGE_NAME, AGENT_NAME,
        {"days_aged": days_aged, "state": state, "recv_dt": recv_dt},
        output_data, outcome, confidence, reasoning
    )

    return output_data


def _try_bedrock(claim: dict) -> dict:
    """Try to use Bedrock for timely filing analysis."""
    prompt = f"""You are a healthcare claims timely filing analyst.
Analyze timely filing for:
Claim: {claim.get('claim_number')}
Days aged: {claim.get('days_aged', 0)}
State: {claim.get('state', 'OH')}
Received date: {claim.get('recv_dt', 'N/A')}
Provider: {claim.get('provider_name')}
Provider specialty: {claim.get('provider_specialty', 'N/A')}
Subscriber ID: {claim.get('subscriber_id', 'N/A')}
PAR flag: {claim.get('par_flag', 'N/A')}

State filing limit: {STATE_FILING_LIMITS.get(claim.get('state', 'OH'), 365)} days

Generate header_detail with: member_id, specialty, place_of_service, par_status, received_date

Determine outcome:
- "Passed Timely Filing" if days_aged <= state limit
- "Denied - Timely Filing" if days_aged > state limit

Return JSON:
{{
  "header_detail": {{...}},
  "outcome": "...",
  "days_remaining": <int>,
  "reasoning": "...",
  "confidence": "High" or "Medium" or "Low"
}}"""

    response = call_bedrock(prompt, max_tokens=1000)
    return parse_bedrock_json(response)


def _deterministic_logic(claim: dict) -> tuple:
    """Deterministic fallback for timely filing check."""
    days_aged = claim.get("days_aged", 0) or 0
    state = claim.get("state", "OH") or "OH"
    recv_dt = claim.get("recv_dt", "") or ""
    claim_number = claim.get("claim_number", "")

    # Seed for deterministic values
    seed_val = sum(ord(c) for c in claim_number) if claim_number else 42
    rng = random.Random(seed_val)

    # Get filing limit for state
    filing_limit = STATE_FILING_LIMITS.get(state, STATE_FILING_LIMITS["DEFAULT"])
    days_remaining = filing_limit - days_aged

    # Generate header detail
    subscriber_id = claim.get("subscriber_id", "") or f"SUB{seed_val:08d}"
    specialty = claim.get("provider_specialty", "") or "General Practice"
    par_flag = claim.get("par_flag", "") or "Y"
    pos = POS_CODES[seed_val % len(POS_CODES)]

    header_detail = {
        "member_id": subscriber_id,
        "specialty": specialty,
        "place_of_service": pos,
        "par_status": par_flag,
        "received_date": recv_dt or datetime.now().strftime("%m/%d/%Y"),
    }

    # Determine outcome
    if days_aged > filing_limit:
        outcome = "Denied - Timely Filing"
        confidence = "High"
        reasoning = (
            f"Claim aged {days_aged} days exceeds {state} filing limit of {filing_limit} days. "
            f"Exceeded by {days_aged - filing_limit} days. Timely filing denial recommended."
        )
    elif days_aged > filing_limit - 30:
        outcome = "Passed Timely Filing"
        confidence = "Medium"
        reasoning = (
            f"Claim aged {days_aged} days is within {state} filing limit of {filing_limit} days "
            f"but only {days_remaining} days remaining. Close to deadline - flagged for attention."
        )
    else:
        outcome = "Passed Timely Filing"
        confidence = "High"
        reasoning = (
            f"Claim aged {days_aged} days is well within {state} filing limit of {filing_limit} days. "
            f"{days_remaining} days remaining. No timely filing concerns."
        )

    return header_detail, outcome, reasoning, confidence, days_remaining


def _store_header_detail(claim_id: str, header_detail: dict):
    """Store claim header detail record."""
    conn = get_db()
    cur = conn.cursor()

    # Upsert - delete existing and insert new
    cur.execute("DELETE FROM claim_header_detail WHERE claim_id = %s", (claim_id,))
    cur.execute("""
        INSERT INTO claim_header_detail (claim_id, member_id, specialty, place_of_service, par_status, received_date)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        claim_id,
        header_detail.get("member_id", ""),
        header_detail.get("specialty", ""),
        header_detail.get("place_of_service", ""),
        header_detail.get("par_status", ""),
        header_detail.get("received_date", ""),
    ))

    conn.commit()
    cur.close()
    conn.close()
