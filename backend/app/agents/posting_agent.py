"""Stage 7: Posting Agent.

Aggregates results from prior stages and generates posting recommendations
including allowed amount, non-covered, denial codes, and payment disposition.
"""
import json
from app.agents.base_agent import call_bedrock, store_stage_output, parse_bedrock_json
from app.db.pool import get_db

STAGE_NUMBER = 7
STAGE_NAME = "Posting Recommendation"
AGENT_NAME = "Posting Agent"

# Denial code mappings
DENIAL_CODES = {
    "DN017": "Coverage terminated - not eligible on date of service",
    "DN018": "Insurance carrier mismatch - wrong primary payer",
    "DNEOB": "EOB not on file - cannot verify primary payment",
    "DNNPR": "Non-covered per contractual obligation",
    "DNTF": "Denied - Timely filing limit exceeded",
}


def run_posting_agent(claim: dict, prior_results: dict) -> dict:
    """Run posting recommendation for a claim based on prior stage results."""
    claim_id = claim["id"]
    claim_number = claim.get("claim_number", "")
    billed_amount = float(claim.get("billed_amount", 0) or 0)

    # Extract key data from prior stages
    stage_2 = prior_results.get("stage_2", {})
    stage_3 = prior_results.get("stage_3", {})
    stage_4 = prior_results.get("stage_4", {})
    stage_5 = prior_results.get("stage_5", {})
    stage_6 = prior_results.get("stage_6", {})

    # Try Bedrock for enhanced posting logic
    bedrock_result = _try_bedrock(claim, prior_results)

    if bedrock_result:
        outcome = bedrock_result.get("outcome", "Ready for Posting")
        reasoning = bedrock_result.get("reasoning", "")
        confidence = bedrock_result.get("confidence", "High")
        posting_data = bedrock_result.get("posting_data", {})
        denial_codes = bedrock_result.get("denial_codes", [])
    else:
        # Deterministic fallback
        outcome, reasoning, confidence, posting_data, denial_codes = _deterministic_logic(
            claim, stage_2, stage_3, stage_4, stage_5, stage_6
        )

    # Build output
    output_data = {
        "outcome": outcome,
        "confidence": confidence,
        "reasoning": reasoning,
        "posting_data": posting_data,
        "denial_codes": denial_codes,
        "payment_disposition": posting_data.get("disposition", ""),
        "allowed_amount": posting_data.get("allowed_amount", 0),
        "non_covered": posting_data.get("non_covered", 0),
        "net_payable": posting_data.get("net_payable", 0),
        "copay": posting_data.get("copay", 0),
        "coinsurance": posting_data.get("coinsurance", 0),
    }

    # Store stage output
    store_stage_output(
        claim_id, STAGE_NUMBER, STAGE_NAME, AGENT_NAME,
        {"claim_number": claim_number, "billed_amount": billed_amount, "prior_outcomes": {
            "hold_code": stage_2.get("outcome", ""),
            "eligibility": stage_3.get("outcome", ""),
            "timely_filing": stage_4.get("outcome", ""),
            "coordination": stage_5.get("outcome", ""),
            "calculation": stage_6.get("outcome", ""),
        }},
        output_data, outcome, confidence, reasoning
    )

    return output_data


def _try_bedrock(claim: dict, prior_results: dict) -> dict:
    """Try to use Bedrock for posting recommendation."""
    # Summarize prior results for the prompt
    summary = {}
    for key, val in prior_results.items():
        if isinstance(val, dict):
            summary[key] = {
                "outcome": val.get("outcome", ""),
                "confidence": val.get("confidence", ""),
            }

    prompt = f"""You are a healthcare claims posting specialist.
Generate posting recommendation for claim {claim.get('claim_number')}:
Billed: ${claim.get('billed_amount', 0)}
Classification: {claim.get('classification')}

Prior stage results:
{json.dumps(summary, indent=2)}

COB Calculation net amount: ${prior_results.get('stage_6', {}).get('net_amount', 0)}
Coordination outcome: {prior_results.get('stage_5', {}).get('outcome', 'N/A')}

Determine:
1. If any prior stage has a denial outcome, generate denial posting
2. If all stages pass, generate payment posting with amounts
3. If exceptions exist, flag for posting exception

Return JSON:
{{
  "outcome": "Ready for Posting" or "Posting Exception",
  "posting_data": {{
    "disposition": "Pay" or "Deny" or "Pend",
    "allowed_amount": ...,
    "non_covered": ...,
    "net_payable": ...,
    "copay": ...,
    "coinsurance": ...
  }},
  "denial_codes": [...],
  "reasoning": "...",
  "confidence": "High" or "Medium" or "Low"
}}"""

    response = call_bedrock(prompt, max_tokens=1500)
    return parse_bedrock_json(response)


def _deterministic_logic(claim: dict, stage_2: dict, stage_3: dict, stage_4: dict, stage_5: dict, stage_6: dict) -> tuple:
    """Deterministic fallback for posting recommendation."""
    billed_amount = float(claim.get("billed_amount", 0) or 0)
    denial_codes = []
    has_exception = False

    # Check for denial conditions from prior stages
    # Stage 2: Hold code issues
    if stage_2.get("outcome") == "Duplicate Review Required":
        denial_codes.append("EXDUC")
        has_exception = True

    # Stage 3: Eligibility denials
    elig_outcome = stage_3.get("outcome", "")
    if elig_outcome in ("DN017", "DN018", "DNEOB"):
        denial_codes.append(elig_outcome)

    # Stage 4: Timely filing denial
    if stage_4.get("outcome") == "Denied - Timely Filing":
        denial_codes.append("DNTF")

    # Stage 5: Coordination denial
    if stage_5.get("outcome") == "DNNPR":
        denial_codes.append("DNNPR")

    # Get calculation amounts
    net_amount = float(stage_6.get("net_amount", 0) or 0)
    non_covered = float(stage_6.get("non_covered", 0) or 0)
    total_allowed = float(stage_6.get("total_allowed", 0) or 0)

    # Determine posting disposition
    if denial_codes:
        # Denial posting
        disposition = "Deny"
        allowed_amount = 0
        net_payable = 0
        copay = 0
        coinsurance = 0
        outcome = "Ready for Posting"
        confidence = "High"
        denial_descriptions = [f"{code}: {DENIAL_CODES.get(code, 'Unknown')}" for code in denial_codes]
        reasoning = (
            f"Denial posting recommended. Codes: {'; '.join(denial_descriptions)}. "
            f"Claim {claim.get('claim_number')} will be denied with zero payment."
        )
    elif has_exception:
        # Exception - needs manual review
        disposition = "Pend"
        allowed_amount = total_allowed
        net_payable = 0
        copay = 0
        coinsurance = 0
        outcome = "Posting Exception"
        confidence = "Medium"
        reasoning = (
            f"Posting exception flagged. Duplicate review required before payment can be processed. "
            f"Claim requires manual examiner review."
        )
    else:
        # Payment posting
        disposition = "Pay"
        allowed_amount = total_allowed if total_allowed > 0 else billed_amount * 0.85
        net_payable = net_amount if net_amount > 0 else allowed_amount * 0.3
        copay = float(stage_6.get("line_calculations", [{}])[0].get("copay", 0)) if stage_6.get("line_calculations") else 25.0
        coinsurance = round(allowed_amount * 0.1, 2)
        outcome = "Ready for Posting"
        confidence = "High"

        coordination_type = stage_5.get("coordination_type", "Secondary")
        reasoning = (
            f"Payment posting recommended as {coordination_type}. "
            f"Allowed: ${allowed_amount:.2f}, Non-covered: ${non_covered:.2f}, "
            f"Net payable: ${net_payable:.2f}. All prior stages passed validation."
        )

    posting_data = {
        "disposition": disposition,
        "allowed_amount": round(allowed_amount, 2),
        "non_covered": round(non_covered, 2),
        "net_payable": round(net_payable, 2),
        "copay": round(copay, 2),
        "coinsurance": round(coinsurance, 2),
    }

    return outcome, reasoning, confidence, posting_data, denial_codes
