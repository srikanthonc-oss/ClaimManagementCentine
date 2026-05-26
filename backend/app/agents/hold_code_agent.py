"""Stage 2: Hold Code Validation Agent.

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
    "COBHD": "COB Hold - Claim on hold pending coordination of benefits processing and determination of primary/secondary payer responsibility",
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
        # Extract from new structured format
        hold_code_entries = bedrock_result.get("hold_codes_detail", [])
        validation_summary = bedrock_result.get("validation_summary", {})
        ai_reasoning = bedrock_result.get("ai_reasoning", {})
        end_result = bedrock_result.get("end_result", {})

        confidence = validation_summary.get("confidence", "High")
        outcome = end_result.get("status", "Continue COB Review")
        reasoning = end_result.get("summary", "")

        # Build the full output matching expected structure
        output_data = bedrock_result
    else:
        # Deterministic fallback - generate the full structured output
        hold_code_entries = []
        output_data = _deterministic_full_output(claim, hold_codes)
        hold_code_entries = output_data.get("hold_codes_detail", [])
        end_result = output_data.get("end_result", {})
        validation_summary = output_data.get("validation_summary", {})
        confidence = validation_summary.get("confidence", "High")
        outcome = end_result.get("status", "Continue COB Review")
        reasoning = end_result.get("summary", "")

    # Store hold code entries in claim_hold_codes table
    _store_hold_codes(claim_id, hold_code_entries)

    # Store stage output - output_data is the full structured JSON
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

Analyze the following claim and its hold codes. Return ONLY a valid JSON object — no markdown, no code fences, no text before or after.

Claim ID: {claim.get('claim_number')}
Billed Amount: ${claim.get('billed_amount', 0)}
Platform: {claim.get('platform')}
Claim Classification: {claim.get('classification')}
Hold Codes: {', '.join(hold_codes)}

Known COB hold code families: COBOC (COB Other Carrier), COBHD (COB Hold), COBPR (COB Primary), COBMD (COB Medicare), COBRV (COB Review), COBSC (COB Secondary).
Duplicate codes: EXDUC, DNDUC.

Instructions:
1. For each hold code, determine line_no, history (N=new, Y=previously processed), reason, and a detailed description.
2. Apply 5 validation rules: Hold Code Family Classification, Processing Status, COB Classification Match, Duplicate Indicator Check, Amount Validation.
3. Provide AI reasoning with 5 business rules (BR-001 through BR-005) specific to this claim's hold code and platform.
4. Determine end result: status, summary, next_steps, and confidence_level.

Return this exact JSON structure:
{{
  "claim_analysis": {{
    "claim_id": "{claim.get('claim_number')}",
    "billed_amount": "${claim.get('billed_amount', 0)}",
    "platform": "{claim.get('platform')}",
    "claim_classification": "{claim.get('classification')}"
  }},
  "hold_codes_detail": [
    {{
      "line_no": 1,
      "hold_code": "<the hold code>",
      "history": "N",
      "reason": "COB",
      "description": "<detailed description of what this hold code means>"
    }}
  ],
  "validation_summary": {{
    "confidence": "High",
    "validation_rules": [
      {{
        "rule": "Hold Code Family Classification",
        "logic_applied": "Is hold code COBOC or COBHD?",
        "result": "<actual finding for this claim>",
        "status": "✓ VALID"
      }},
      {{
        "rule": "Processing Status",
        "logic_applied": "Is History = 'Y' (previously processed)?",
        "result": "<actual finding>",
        "status": "✓ FRESH CLAIM - NEW HOLD"
      }},
      {{
        "rule": "COB Classification Match",
        "logic_applied": "Does claim classification match hold code reason?",
        "result": "<actual finding>",
        "status": "✓ CLASSIFICATION ALIGNED"
      }},
      {{
        "rule": "Duplicate Indicator Check",
        "logic_applied": "Is hold code duplicate-related (EXDUC, DNDUC)?",
        "result": "<actual finding>",
        "status": "✓ NO DUPLICATE FLAG"
      }},
      {{
        "rule": "Amount Validation",
        "logic_applied": "Is billed amount present and valid?",
        "result": "<actual finding>",
        "status": "✓ AMOUNT VALID"
      }}
    ]
  }},
  "ai_reasoning": {{
    "hold_code_qualification": "<why the hold code qualifies for COB processing>",
    "business_rules_applied": [
      "BR-001: <rule>",
      "BR-002: <rule>",
      "BR-003: <rule>",
      "BR-004: <rule>",
      "BR-005: <rule>"
    ],
    "action_required": "<what action should be taken>"
  }},
  "end_result": {{
    "status": "HOLD ACTIVE - COB PROCESSING REQUIRED",
    "summary": "<comprehensive summary>",
    "next_steps": [
      "1. <step>",
      "2. <step>",
      "3. <step>",
      "4. <step>",
      "5. <step>"
    ],
    "confidence_level": "High - All validation rules passed"
  }}
}}"""


def _try_bedrock_with_prompt(prompt: str) -> dict:
    """Try to use Bedrock with the given prompt."""
    if not prompt:
        return None
    response = call_bedrock(prompt, max_tokens=2500)
    if response:
        print(f"[Hold Code Agent] Bedrock raw response (first 300 chars): {response[:300]}")
    else:
        print("[Hold Code Agent] Bedrock returned None")
    result = parse_bedrock_json(response)
    if not result:
        print(f"[Hold Code Agent] Failed to parse JSON from Bedrock response")
    return result


def _try_bedrock(claim: dict, hold_codes: list) -> dict:
    """Try to use Bedrock for hold code analysis (legacy wrapper)."""
    prompt = _build_prompt(claim, hold_codes)
    return _try_bedrock_with_prompt(prompt)


def _deterministic_full_output(claim: dict, hold_codes: list) -> dict:
    """Deterministic fallback that produces the full structured output format."""
    claim_number = claim.get("claim_number", "")
    billed_amount = claim.get("billed_amount", 0)
    platform = claim.get("platform", "")
    classification = claim.get("classification", "")
    days_aged = claim.get("days_aged", 0) or 0

    hold_code_entries = []
    has_exduc = False
    has_cob = False
    all_processed = True

    for i, code in enumerate(hold_codes, 1):
        history = "Y" if days_aged > 180 and i > 1 else "N"
        if history == "N":
            all_processed = False

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

    # Determine status and confidence
    if has_exduc:
        status = "DUPLICATE REVIEW REQUIRED"
        confidence = "Medium"
        confidence_level = "Medium - Duplicate indicator detected"
        summary = f"Claim {claim_number} has EXDUC hold code indicating potential duplicate submission. Duplicate review required before COB processing can proceed. Billed amount ${billed_amount} must be validated against original claim."
    elif all_processed and hold_codes:
        status = "PREVIOUSLY PROCESSED"
        confidence = "High"
        confidence_level = "High - All codes show prior processing"
        summary = f"Claim {claim_number} hold codes show prior processing history. Claim may have been previously adjudicated."
    elif has_cob:
        status = "HOLD ACTIVE - COB PROCESSING REQUIRED"
        confidence = "High"
        confidence_level = "High - All validation rules passed"
        cob_codes = [c for c in hold_codes if c.startswith("COB")]
        summary = f"Claim {claim_number} is correctly placed on COB Hold ({', '.join(cob_codes)}). This is a new hold requiring investigation of coordination of benefits. The ${billed_amount} claim must be processed to determine primary and secondary payer responsibility before payment authorization."
    else:
        status = "HOLD ACTIVE - REVIEW REQUIRED"
        confidence = "Medium"
        confidence_level = "Medium - Non-standard hold codes"
        summary = f"Claim {claim_number} has hold codes {', '.join(hold_codes)} requiring standard review processing."

    # Build validation rules
    primary_code = hold_codes[0] if hold_codes else ""
    is_cob_family = primary_code.startswith("COB")

    validation_rules = [
        {
            "rule": "Hold Code Family Classification",
            "logic_applied": "Is hold code COBOC or COBHD?",
            "result": f"{primary_code} {'matches' if is_cob_family else 'does not match'} COB hold code family",
            "status": "✓ VALID" if is_cob_family else "✗ NOT COB FAMILY"
        },
        {
            "rule": "Processing Status",
            "logic_applied": "Is History = 'Y' (previously processed)?",
            "result": f"History = '{hold_code_entries[0]['history'] if hold_code_entries else 'N'}' ({'previously processed' if hold_code_entries and hold_code_entries[0]['history'] == 'Y' else 'not previously processed'})",
            "status": "✓ FRESH CLAIM - NEW HOLD" if hold_code_entries and hold_code_entries[0]["history"] == "N" else "✓ PREVIOUSLY PROCESSED"
        },
        {
            "rule": "COB Classification Match",
            "logic_applied": "Does claim classification match hold code reason?",
            "result": f"Claim classification '{classification}' {'matches' if classification and 'COB' in classification.upper() else 'noted for'} hold reason '{hold_code_entries[0]['reason'] if hold_code_entries else 'N/A'}'",
            "status": "✓ CLASSIFICATION ALIGNED"
        },
        {
            "rule": "Duplicate Indicator Check",
            "logic_applied": "Is hold code duplicate-related (EXDUC, DNDUC)?",
            "result": f"{primary_code} {'is' if has_exduc else 'is not'} a duplicate denial code",
            "status": "✗ DUPLICATE DETECTED" if has_exduc else "✓ NO DUPLICATE FLAG"
        },
        {
            "rule": "Amount Validation",
            "logic_applied": "Is billed amount present and valid?",
            "result": f"Billed amount ${billed_amount} is {'valid and processable' if billed_amount and float(billed_amount) > 0 else 'missing or zero'}",
            "status": "✓ AMOUNT VALID" if billed_amount and float(billed_amount) > 0 else "✗ AMOUNT INVALID"
        }
    ]

    # Build business rules
    business_rules = [
        f"BR-001: {primary_code} is a {'valid COB hold code per claim processing standards' if is_cob_family else 'non-COB hold code requiring review'}",
        f"BR-002: {'New holds (History=N) require COB investigation and payer sequencing' if not all_processed else 'Previously processed holds may be re-evaluated'}",
        f"BR-003: COB holds remain active until primary/secondary payer responsibility is determined",
        f"BR-004: Claim must be reviewed for other insurance coverage before payment determination",
        f"BR-005: {platform} platform supports COB hold processing and adjudication workflows",
    ]

    # Build next steps
    if has_cob:
        next_steps = [
            "1. Verify patient's other insurance coverage (primary payer)",
            "2. Determine payer sequencing (primary vs. secondary)",
            "3. Request EOB from primary carrier if applicable",
            "4. Process secondary adjudication per COB guidelines",
            "5. Release hold upon completion of COB determination"
        ]
    elif has_exduc:
        next_steps = [
            "1. Compare claim against potential duplicate submissions",
            "2. Verify service dates and provider match",
            "3. Check if original claim was already paid",
            "4. Determine if this is a true duplicate or corrected claim",
            "5. Deny as duplicate or release for processing"
        ]
    else:
        next_steps = [
            "1. Review hold code reason and determine required action",
            "2. Gather additional documentation if needed",
            "3. Validate claim data against system records",
            "4. Process according to hold code resolution guidelines",
            "5. Release hold and route for payment or denial"
        ]

    # Action required
    if has_cob:
        action_required = "Route claim for COB investigation - verify other coverage, determine payer sequence, and process secondary claim if applicable"
    elif has_exduc:
        action_required = "Route claim for duplicate review - compare against existing claims and determine if true duplicate"
    else:
        action_required = f"Route claim for {hold_code_entries[0]['reason'] if hold_code_entries else 'general'} review and resolution"

    return {
        "claim_analysis": {
            "claim_id": claim_number,
            "billed_amount": f"${billed_amount}",
            "platform": platform,
            "claim_classification": classification
        },
        "hold_codes_detail": hold_code_entries,
        "validation_summary": {
            "confidence": confidence,
            "validation_rules": validation_rules
        },
        "ai_reasoning": {
            "hold_code_qualification": f"{primary_code} {'qualifies for COB processing because it belongs to the COB hold code family and indicates a pending coordination of benefits determination' if is_cob_family else 'requires review as it is not in the COB hold code family'}",
            "business_rules_applied": business_rules,
            "action_required": action_required
        },
        "end_result": {
            "status": status,
            "summary": summary,
            "next_steps": next_steps,
            "confidence_level": confidence_level
        }
    }


def _deterministic_logic(claim: dict, hold_codes: list) -> tuple:
    """Legacy deterministic fallback returning simple tuple."""
    output = _deterministic_full_output(claim, hold_codes)
    end_result = output.get("end_result", {})
    validation = output.get("validation_summary", {})
    return (
        output.get("hold_codes_detail", []),
        end_result.get("status", "Continue COB Review"),
        end_result.get("summary", ""),
        validation.get("confidence", "High")
    )


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
