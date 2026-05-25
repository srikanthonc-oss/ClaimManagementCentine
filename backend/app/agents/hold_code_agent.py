"""Stage 2:     

Reads the claim's hold_code field, extracts/generates hold code data,
stores in claim_hold_codes table, and applies business logic.
"""
import json
from app.agents.base_agent import call_bedrock, store_stage_output, parse_bedrock_json
from app.db.pool import get_db

STAGE_NUMBER = 2
STAGE_NAME = "Hold Code Validation"
AGENT_NAME = "Hold Code Agent"

# Known hold code descriptions
HOLD_CODE_MAP = {
    "COBOC": "COB Other Carrier - Primary insurance payment pending",
    "COBHD": "COB Hold - High Dollar review required",
    "COBPR": "COB Primary - Awaiting primary carrier EOB",
    "TSSHD": "TSS Hold - Third-party subrogation review",
    "EXDUC": "Exact Duplicate Claim - Potential duplicate submission",
    "COBMD": "COB Medicare - Medicare as primary payer",
    "COBRV": "COB Review - General COB review required",
    "PNDPR": "Pending Provider - Provider information needed",
    "HLDAU": "Hold Audit - Audit review required",
    "COBSC": "COB Secondary - Secondary payer determination",
}


def run_hold_code_agent(claim: dict) -> dict:
    """Run hold code validation for a claim."""
    claim_id = claim["id"]
    hold_code_str = claim.get("hold_code", "") or ""
    claim_number = claim.get("claim_number", "")

    # Parse comma-separated hold codes
    hold_codes = [hc.strip() for hc in hold_code_str.split(",") if hc.strip()]

    # Try Bedrock for enhanced reasoning
    prompt_used = _build_prompt(claim, hold_codes)
    bedrock_result = _try_bedrock_with_prompt(prompt_used)

    if bedrock_result:
        hold_code_entries = bedrock_result.get("hold_codes", [])
        outcome = bedrock_result.get("outcome", "Continue COB Review")
        reasoning = bedrock_result.get("reasoning", "")
        confidence = bedrock_result.get("confidence", "High")
    else:
        # Deterministic fallback
        hold_code_entries, outcome, reasoning, confidence = _deterministic_logic(claim, hold_codes)

    # Store hold code entries in claim_hold_codes table
    _store_hold_codes(claim_id, hold_code_entries)

    # Build output
    output_data = {
        "hold_codes": hold_code_entries,
        "outcome": outcome,
        "confidence": confidence,
        "reasoning": reasoning,
        "total_codes": len(hold_code_entries),
        "has_cob_code": any(hc.get("hold_code", "").startswith("COB") for hc in hold_code_entries),
        "has_duplicate": any(hc.get("hold_code") == "EXDUC" for hc in hold_code_entries),
    }

    # Store stage output
    store_stage_output(
        claim_id, STAGE_NUMBER, STAGE_NAME, AGENT_NAME,
        {"hold_code": hold_code_str, "claim_number": claim_number},
        output_data, outcome, confidence, reasoning,
        prompt_text=prompt_used
    )

    return output_data


def _build_prompt(claim: dict, hold_codes: list) -> str:
    """Build the prompt for hold code analysis."""
    if not hold_codes:
        return ""
    return f"""You are a healthcare claims COB (Coordination of Benefits) hold code analyst.
Analyze these hold codes for claim {claim.get('claim_number')}:
Hold codes: {', '.join(hold_codes)}
Claim classification: {claim.get('classification')}
Platform: {claim.get('platform')}
Billed amount: ${claim.get('billed_amount', 0)}

For each hold code, provide:
- line_no (sequential starting at 1)
- hold_code (the code)
- history ("Y" if previously processed, "N" if new)
- reason ("COB", "Duplicate", "Review", "Subrogation", etc.)
- description (brief explanation)

Then determine the outcome:
- "Continue COB Review" if COBOC or COBHD present and no duplicates
- "Already Processed" if all codes show history="Y"
- "Duplicate Review Required" if EXDUC is present

Return JSON:
{{
  "hold_codes": [...],
  "outcome": "...",
  "reasoning": "...",
  "confidence": "High" or "Medium" or "Low"
}}"""


def _try_bedrock_with_prompt(prompt: str) -> dict:
    """Try to use Bedrock with the given prompt."""
    if not prompt:
        return None
    response = call_bedrock(prompt, max_tokens=1500)
    return parse_bedrock_json(response)


def _try_bedrock(claim: dict, hold_codes: list) -> dict:
    """Try to use Bedrock for hold code analysis (legacy wrapper)."""
    prompt = _build_prompt(claim, hold_codes)
    return _try_bedrock_with_prompt(prompt)


def _deterministic_logic(claim: dict, hold_codes: list) -> tuple:
    """Deterministic fallback for hold code validation."""
    hold_code_entries = []
    has_exduc = False
    has_cob = False
    all_processed = True

    for i, code in enumerate(hold_codes, 1):
        # Determine history based on claim age
        days_aged = claim.get("days_aged", 0) or 0
        history = "Y" if days_aged > 180 and i > 1 else "N"
        if history == "N":
            all_processed = False

        # Determine reason
        if code.startswith("COB"):
            reason = "COB"
            has_cob = True
        elif code == "EXDUC":
            reason = "Duplicate"
            has_exduc = True
        elif code.startswith("TSS"):
            reason = "Subrogation"
        elif code.startswith("PND"):
            reason = "Pending"
        elif code.startswith("HLD"):
            reason = "Audit"
        else:
            reason = "Review"

        description = HOLD_CODE_MAP.get(code, f"Hold code {code} - Review required")

        hold_code_entries.append({
            "line_no": i,
            "hold_code": code,
            "history": history,
            "reason": reason,
            "description": description,
        })

    # Determine outcome
    if has_exduc:
        outcome = "Duplicate Review Required"
        confidence = "Medium"
        reasoning = f"EXDUC hold code detected among {len(hold_codes)} codes. Duplicate claim review required before COB processing."
    elif all_processed and hold_codes:
        outcome = "Already Processed"
        confidence = "High"
        reasoning = f"All {len(hold_codes)} hold codes show prior processing history. Claim may have been previously adjudicated."
    elif has_cob:
        outcome = "Continue COB Review"
        confidence = "High"
        reasoning = f"COB hold code(s) present ({', '.join(c for c in hold_codes if c.startswith('COB'))}). Proceeding with COB pend resolution pipeline."
    else:
        outcome = "Continue COB Review"
        confidence = "Medium"
        reasoning = f"Hold codes {', '.join(hold_codes)} require standard review processing."

    return hold_code_entries, outcome, reasoning, confidence


def _store_hold_codes(claim_id: str, hold_code_entries: list):
    """Store hold code entries in the claim_hold_codes table."""
    conn = get_db()
    cur = conn.cursor()

    # Clear existing entries for this claim
    cur.execute("DELETE FROM claim_hold_codes WHERE claim_id = %s", (claim_id,))

    for entry in hold_code_entries:
        cur.execute("""
            INSERT INTO claim_hold_codes (claim_id, line_no, hold_code, history, reason, description)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            claim_id,
            entry.get("line_no", 1),
            entry.get("hold_code", ""),
            entry.get("history", "N"),
            entry.get("reason", ""),
            entry.get("description", ""),
        ))

    conn.commit()
    cur.close()
    conn.close()
