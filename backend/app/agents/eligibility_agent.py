"""Stage 3: Member Eligibility & COB History Agent.

Generates COB history (insurance records), EOB extraction data,
stores in claim_cob_history and claim_eob_extraction tables,
and applies eligibility/coverage logic.
"""
import json
import random
from datetime import datetime, timedelta
from app.agents.base_agent import call_bedrock, store_stage_output, parse_bedrock_json
from app.db.pool import get_db

STAGE_NUMBER = 3
STAGE_NAME = "Member Eligibility & COB History"
AGENT_NAME = "Eligibility Agent"

# Reference insurance carriers
INSURANCE_CARRIERS = [
    "Medicare Part A", "Medicare Part B", "Cigna Health", "Aetna PPO",
    "UnitedHealthcare", "Blue Cross Blue Shield", "Humana Gold",
    "Anthem BCBS", "Kaiser Permanente", "Molina Healthcare"
]

# Common CPT codes for COB claims
CPT_CODES = ["99213", "99214", "99215", "99203", "99204", "99232", "99233",
             "71046", "73721", "27447", "43239", "29881", "99291"]

# PR (Patient Responsibility) reason codes
PR_CODES = {
    "PR-1": "Deductible Amount",
    "PR-2": "Coinsurance Amount",
    "PR-3": "Copay Amount",
    "PR-96": "Non-covered charge - primary payer",
    "PR-204": "This service/equipment/drug is not covered under the patient's current benefit plan",
    "CO-45": "Charge exceeds fee schedule/maximum allowable",
}


def run_eligibility_agent(claim: dict) -> dict:
    """Run eligibility and COB history check for a claim."""
    claim_id = claim["id"]
    claim_number = claim.get("claim_number", "")
    billed_amount = float(claim.get("billed_amount", 0) or 0)

    # Try Bedrock for enhanced data generation
    bedrock_result = _try_bedrock(claim)

    if bedrock_result:
        cob_history = bedrock_result.get("cob_history", [])
        eob_data = bedrock_result.get("eob_extraction", [])
        outcome = bedrock_result.get("outcome", "Primary Insurance Verified")
        reasoning = bedrock_result.get("reasoning", "")
        confidence = bedrock_result.get("confidence", "High")
        primary_insurance = bedrock_result.get("primary_insurance", "")
    else:
        # Deterministic fallback
        cob_history, eob_data, outcome, reasoning, confidence, primary_insurance = _deterministic_logic(claim)

    # Store COB history
    _store_cob_history(claim_id, cob_history)

    # Store EOB extraction
    _store_eob_extraction(claim_id, eob_data)

    # Build output
    output_data = {
        "cob_history": cob_history,
        "eob_extraction": eob_data,
        "outcome": outcome,
        "confidence": confidence,
        "reasoning": reasoning,
        "primary_insurance": primary_insurance,
        "coverage_verified": outcome == "Primary Insurance Verified",
        "total_pr_amount": sum(float(e.get("pr_amount", 0)) for e in eob_data),
    }

    # Store stage output
    store_stage_output(
        claim_id, STAGE_NUMBER, STAGE_NAME, AGENT_NAME,
        {"claim_number": claim_number, "billed_amount": billed_amount},
        output_data, outcome, confidence, reasoning
    )

    return output_data


def _try_bedrock(claim: dict) -> dict:
    """Try to use Bedrock for eligibility analysis."""
    billed = claim.get("billed_amount", 0)
    prompt = f"""You are a healthcare COB eligibility analyst. Generate realistic COB history and EOB extraction data for:
Claim: {claim.get('claim_number')}
Billed amount: ${billed}
Classification: {claim.get('classification')}
Provider: {claim.get('provider_name')}
State: {claim.get('state')}
Subscriber ID: {claim.get('subscriber_id', 'N/A')}

Generate:
1. cob_history: 1-2 insurance records with sno, primary_insurance, effective_date, term_date
2. eob_extraction: 1-2 EOB line items with sno, cpt, insurance_name, paid_amt, adj_grp_code, reason_code, pr_amount, image_ref
3. Determine outcome based on:
   - If DOS within coverage dates and insurance matches: "Primary Insurance Verified"
   - If coverage gap: "DN017" (coverage terminated)
   - If insurance mismatch: "DN018" (wrong carrier)
   - If no EOB data: "DNEOB" (EOB not on file)

Return JSON:
{{
  "cob_history": [...],
  "eob_extraction": [...],
  "outcome": "...",
  "primary_insurance": "...",
  "reasoning": "...",
  "confidence": "High" or "Medium" or "Low"
}}"""

    response = call_bedrock(prompt, max_tokens=2000)
    return parse_bedrock_json(response)


def _deterministic_logic(claim: dict) -> tuple:
    """Deterministic fallback for eligibility check."""
    billed_amount = float(claim.get("billed_amount", 0) or 0)
    claim_number = claim.get("claim_number", "")
    state = claim.get("state", "OH")
    days_aged = claim.get("days_aged", 0) or 0

    # Use claim number hash for deterministic randomness
    seed_val = sum(ord(c) for c in claim_number) if claim_number else 42
    rng = random.Random(seed_val)

    # Generate COB history (1-2 records)
    num_records = 2 if billed_amount > 5000 else 1
    primary_carrier = INSURANCE_CARRIERS[seed_val % len(INSURANCE_CARRIERS)]

    # Generate dates relative to claim
    base_year = 2024
    eff_date = f"01/01/{base_year - 1}"
    term_date = f"12/31/{base_year + 1}"

    cob_history = [{
        "sno": 1,
        "primary_insurance": primary_carrier,
        "effective_date": eff_date,
        "term_date": term_date,
    }]

    if num_records == 2:
        secondary_carrier = INSURANCE_CARRIERS[(seed_val + 3) % len(INSURANCE_CARRIERS)]
        cob_history.append({
            "sno": 2,
            "primary_insurance": secondary_carrier,
            "effective_date": f"06/01/{base_year - 1}",
            "term_date": f"05/31/{base_year + 1}",
        })

    # Generate EOB extraction data
    cpt = CPT_CODES[seed_val % len(CPT_CODES)]
    paid_pct = rng.uniform(0.55, 0.85)
    paid_amt = round(billed_amount * paid_pct, 2)
    pr_amount = round(billed_amount - paid_amt, 2)

    # Determine PR code based on classification
    classification = claim.get("classification", "")
    if "High Dollar" in classification:
        pr_code = "PR-96"
    elif "Duplicate" in classification:
        pr_code = "PR-204"
    elif billed_amount > 10000:
        pr_code = "PR-1"
    else:
        pr_codes_list = ["PR-1", "PR-2", "PR-3"]
        pr_code = pr_codes_list[seed_val % len(pr_codes_list)]

    eob_data = [{
        "sno": 1,
        "cpt": cpt,
        "insurance_name": primary_carrier,
        "paid_amt": paid_amt,
        "adj_grp_code": "PR",
        "reason_code": pr_code,
        "pr_amount": pr_amount,
        "image_ref": f"EOB_{claim_number}_001.pdf",
    }]

    # Determine outcome
    # Most claims pass eligibility; use seed for variation
    outcome_roll = seed_val % 20
    if outcome_roll == 0:
        outcome = "DN017"
        confidence = "High"
        reasoning = f"Coverage terminated for {primary_carrier}. Term date {term_date} precedes service date. Denial DN017 recommended."
    elif outcome_roll == 1:
        outcome = "DN018"
        confidence = "Medium"
        reasoning = f"Insurance carrier mismatch detected. EOB from {primary_carrier} does not match subscriber records."
    elif outcome_roll == 2:
        outcome = "DNEOB"
        confidence = "Low"
        reasoning = "No EOB documentation found on file. Cannot verify primary insurance payment."
    else:
        outcome = "Primary Insurance Verified"
        confidence = "High"
        reasoning = f"Primary insurance {primary_carrier} verified. Coverage active {eff_date} - {term_date}. EOB shows ${paid_amt:.2f} paid with {pr_code} of ${pr_amount:.2f}."

    return cob_history, eob_data, outcome, reasoning, confidence, primary_carrier


def _store_cob_history(claim_id: str, cob_history: list):
    """Store COB history records."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM claim_cob_history WHERE claim_id = %s", (claim_id,))

    for record in cob_history:
        cur.execute("""
            INSERT INTO claim_cob_history (claim_id, sno, primary_insurance, effective_date, term_date)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            claim_id,
            record.get("sno", 1),
            record.get("primary_insurance", ""),
            record.get("effective_date", ""),
            record.get("term_date", ""),
        ))

    conn.commit()
    cur.close()
    conn.close()


def _store_eob_extraction(claim_id: str, eob_data: list):
    """Store EOB extraction records."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM claim_eob_extraction WHERE claim_id = %s", (claim_id,))

    for record in eob_data:
        cur.execute("""
            INSERT INTO claim_eob_extraction (claim_id, sno, cpt, insurance_name, paid_amt, adj_grp_code, reason_code, pr_amount, image_ref)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            claim_id,
            record.get("sno", 1),
            record.get("cpt", ""),
            record.get("insurance_name", ""),
            record.get("paid_amt", 0),
            record.get("adj_grp_code", ""),
            record.get("reason_code", ""),
            record.get("pr_amount", 0),
            record.get("image_ref", ""),
        ))

    conn.commit()
    cur.close()
    conn.close()
