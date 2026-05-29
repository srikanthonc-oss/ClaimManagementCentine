"""Stage 3: Member Eligibility & COB History Agent.

Validates primary insurance coverage using COB history and EOB extraction data.
Applies business logic: DOS vs coverage dates, insurance name matching, PR code validation.
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

# PR reason code descriptions
PR_CODE_DESCRIPTIONS = {
    "1": "Deductible Amount",
    "2": "Coinsurance Amount",
    "3": "Contractual Obligation",
    "45": "Charge exceeds fee schedule",
    "96": "Non-covered charge",
    "204": "Not covered under benefit plan",
}


def run_eligibility_agent(claim: dict) -> dict:
    """Run eligibility and COB history check for a claim."""
    claim_id = claim["id"]
    claim_number = claim.get("claim_number", "")
    billed_amount = float(claim.get("billed_amount", 0) or 0)

    # Fetch COB history and EOB data from DB (may have been uploaded via reference data)
    cob_history = _fetch_cob_history(claim_id)
    eob_data = _fetch_eob_data(claim_id)
    detail_lines = _fetch_detail_lines(claim_id)

    # Try Bedrock for enhanced reasoning
    prompt_used = _build_prompt(claim, cob_history, eob_data, detail_lines)
    bedrock_result = _try_bedrock_with_prompt(prompt_used)

    if bedrock_result:
        output_data = bedrock_result
    else:
        # Deterministic fallback
        output_data = _deterministic_full_output(claim, cob_history, eob_data, detail_lines)

    # Store COB history if generated (not from reference data)
    if not cob_history:
        generated_cob = output_data.get("ai_reasoning", {}).get("primary_insurance_identification", {}).get("analysis", [])
        if generated_cob:
            _store_cob_history(claim_id, [{"sno": i+1, "primary_insurance": r.get("insurance", ""), "effective_date": r.get("effective_date", ""), "term_date": r.get("term_date", "")} for i, r in enumerate(generated_cob)])

    # Store EOB extraction if generated
    if not eob_data:
        pr_codes = output_data.get("coverage_details", {}).get("pr_codes_identified", [])
        if pr_codes:
            _store_eob_extraction(claim_id, [{
                "sno": 1,
                "cpt": "99213",
                "insurance_name": output_data.get("coverage_details", {}).get("eob_insurance_name", ""),
                "paid_amt": 0,
                "adj_grp_code": "PR",
                "reason_code": pr_codes[0].get("code", "") if pr_codes else "",
                "pr_amount": float(pr_codes[0].get("amount", "0").replace("$", "")) if pr_codes else 0,
                "image_ref": "",
            }])

    # Extract key fields for stage output
    recommendation = output_data.get("recommendation", {})
    outcome = recommendation.get("decision", "Primary Insurance Verified")
    denial_code = recommendation.get("denial_code", "")
    if denial_code:
        outcome = denial_code
    confidence = "High" if recommendation.get("decision") in ("APPROVE", "Primary Insurance Verified") else "Medium"
    reasoning = recommendation.get("denial_reason", "") or recommendation.get("action_required", "")

    # Store stage output
    store_stage_output(
        claim_id, STAGE_NUMBER, STAGE_NAME, AGENT_NAME,
        {"claim_number": claim_number, "billed_amount": billed_amount},
        output_data, outcome, confidence, reasoning,
        prompt_text=prompt_used
    )

    return output_data


def _build_prompt(claim: dict, cob_history: list, eob_data: list, detail_lines: list) -> str:
    """Build the prompt for eligibility analysis."""
    billed = claim.get("billed_amount", 0)

    return f"""You are a healthcare COB eligibility analyst. Analyze COB history and EOB extraction data for this claim.

Claim: {claim.get('claim_number')}
Billed amount: ${billed}
Classification: {claim.get('classification')}
Provider: {claim.get('provider_name')}
State: {claim.get('state')}
Subscriber ID: {claim.get('subscriber_id', 'N/A')}

COB History: {json.dumps(cob_history, default=str)}
EOB Data: {json.dumps(eob_data, default=str)}
Detail Lines: {json.dumps(detail_lines, default=str)}

Business Logic:
1. To identify the active primary insurance, apply: Date of service > Effective date AND Term date > Date of service. Source: COBHistory
2. EOB attachment present: Identified primary insurance should match EOB insurance name. If not matching, Deny as DN017 (Medicare) or DN018 (Commercial)
3. Primary EOB doesn't contain PR reasons: Denied as "DNEOB"
4. EOB attachment not present: Deny with DN017 (Medicare) or DN018 (Commercial)

Return ONLY this exact JSON structure:
{{
  "claim_metadata": {{
    "claim_number": "{claim.get('claim_number')}",
    "billed_amount": "${billed}",
    "classification": "{claim.get('classification')}",
    "provider_name": "{claim.get('provider_name')}",
    "state": "{claim.get('state')}",
    "subscriber_id": "{claim.get('subscriber_id', 'N/A')}"
  }},
  "coverage_details": {{
    "date_of_service": "<max end date from detail lines>",
    "coverage_effective_date": "<from COB history>",
    "identified_primary_insurance": "<determined primary>",
    "eob_insurance_name": "<from EOB data>",
    "insurance_match_status": "MATCH" or "MISMATCH",
    "pr_codes_identified": [{{"code": "<code>", "description": "<desc>", "amount": "$<amt>"}}],
    "eob_completeness_status": "COMPLETE" or "INCOMPLETE"
  }},
  "ai_reasoning": {{
    "primary_insurance_identification": {{
      "logic_applied": "DOS > Effective Date AND Term Date > DOS",
      "analysis": [
        {{
          "insurance": "<name>",
          "effective_date": "<date>",
          "term_date": "<date>",
          "dos_greater_than_effective": true/false,
          "term_date_less_than_dos": true/false,
          "is_active": true/false,
          "status": "<ACTIVE or INACTIVE explanation>"
        }}
      ],
      "primary_insurance_result": "<determined primary>"
    }},
    "eob_attachment_analysis": {{
      "eob_present": true/false,
      "eob_source": "COB_Image_Extraction",
      "attached_documents": [{{"document_name": "...", "data_type": "..."}}]
    }},
    "insurance_name_verification": {{
      "identified_primary": "<name>",
      "eob_insurance_name": "<name>",
      "names_match": true/false,
      "match_status": "MATCH" or "MISMATCH",
      "verification_result": "<explanation>"
    }},
    "eob_completeness_assessment": {{
      "pr_codes_present": true/false,
      "pr_reason_codes_documented": true/false,
      "pr_descriptions_available": true/false,
      "adjustment_group_codes": [{{"code": "...", "description": "..."}}],
      "missing_elements": ["..."],
      "completeness_score": "<percentage>",
      "completeness_status": "COMPLETE" or "INCOMPLETE"
    }}
  }},
  "recommendation": {{
    "decision": "APPROVE" or "DENY",
    "denial_code": "<DN017/DN018/DNEOB or empty>",
    "denial_reason": "<reason if denied>",
    "action_required": "<next action>",
    "next_steps": ["<step1>", "<step2>"]
  }}
}}

IMPORTANT: Return ONLY the JSON object. No markdown, no code fences, no text."""


def _try_bedrock_with_prompt(prompt: str) -> dict:
    """Try to use Bedrock with the given prompt."""
    if not prompt:
        return None
    response = call_bedrock(prompt, max_tokens=3000)
    if response:
        print(f"[Eligibility Agent] Bedrock raw response (first 200 chars): {response[:200]}")
    else:
        print("[Eligibility Agent] Bedrock returned None")
    result = parse_bedrock_json(response)
    if not result:
        print("[Eligibility Agent] Failed to parse JSON from Bedrock response")
    return result


def _deterministic_full_output(claim: dict, cob_history: list, eob_data: list, detail_lines: list) -> dict:
    """Deterministic fallback producing the full structured output."""
    claim_number = claim.get("claim_number", "")
    billed_amount = float(claim.get("billed_amount", 0) or 0)
    classification = claim.get("classification", "")
    provider_name = claim.get("provider_name", "")
    state = claim.get("state", "OH")
    subscriber_id = claim.get("subscriber_id", "") or ""

    seed_val = sum(ord(c) for c in claim_number) if claim_number else 42
    rng = random.Random(seed_val)

    # Determine max DOS from detail lines
    max_dos = ""
    if detail_lines:
        for line in detail_lines:
            end_dt = str(line.get("end_date", ""))
            if end_dt and end_dt > max_dos:
                max_dos = end_dt
    if not max_dos:
        max_dos = "06/24/2025"

    # Build insurance analysis from COB history
    insurance_analysis = []
    primary_insurance = "Medicare"
    primary_eff_date = ""
    primary_term_date = ""

    if cob_history:
        for record in cob_history:
            ins_name = record.get("primary_insurance", "Unknown")
            eff_date = record.get("effective_date", "")
            term_date = record.get("term_date", "")

            # Check if DOS is within coverage period
            dos_gt_eff = max_dos > eff_date if eff_date else True
            term_gt_dos = term_date > max_dos if term_date else True
            is_active = dos_gt_eff and term_gt_dos

            if is_active and not primary_eff_date:
                primary_insurance = ins_name
                primary_eff_date = eff_date
                primary_term_date = term_date

            insurance_analysis.append({
                "insurance": ins_name,
                "effective_date": eff_date,
                "term_date": term_date,
                "dos_greater_than_effective": dos_gt_eff,
                "term_date_less_than_dos": not term_gt_dos,
                "is_active": is_active,
                "status": f"ACTIVE - {ins_name} is Primary on DOS" if is_active else f"INACTIVE - Not Primary on DOS (DOS is {'AFTER' if not term_gt_dos else 'BEFORE'} coverage period)",
            })
    else:
        # Generate default
        primary_insurance = INSURANCE_CARRIERS[seed_val % len(INSURANCE_CARRIERS)]
        primary_eff_date = "01/01/2024"
        primary_term_date = "12/31/2025"
        insurance_analysis = [{
            "insurance": primary_insurance,
            "effective_date": primary_eff_date,
            "term_date": primary_term_date,
            "dos_greater_than_effective": True,
            "term_date_less_than_dos": False,
            "is_active": True,
            "status": f"ACTIVE - {primary_insurance} is Primary on DOS",
        }]

    # EOB analysis
    eob_present = len(eob_data) > 0
    eob_insurance_name = ""
    pr_codes = []
    adj_group_codes = []
    paid_amt = 0

    if eob_data:
        eob_record = eob_data[0]
        eob_insurance_name = str(eob_record.get("insurance_name", ""))
        reason_code = str(eob_record.get("reason_code", ""))
        pr_amount = float(eob_record.get("pr_amount", 0) or 0)
        paid_amt = float(eob_record.get("paid_amt", 0) or 0)
        adj_grp = str(eob_record.get("adj_grp_code", ""))

        if reason_code:
            pr_codes.append({
                "code": reason_code,
                "description": PR_CODE_DESCRIPTIONS.get(reason_code, "Adjustment"),
                "amount": f"${pr_amount:.2f}",
            })
        if adj_grp:
            for code in adj_grp.replace(",", " ").split():
                code = code.strip()
                if code:
                    adj_group_codes.append({
                        "code": code,
                        "description": "Contractual Obligation" if code == "CO" else "Patient Responsibility" if code == "PR" else code,
                    })
    else:
        eob_insurance_name = primary_insurance
        pr_codes = [{"code": "3", "description": "Contractual Obligation", "amount": f"${billed_amount * 0.1:.2f}"}]
        adj_group_codes = [{"code": "CO", "description": "Contractual Obligation"}, {"code": "PR", "description": "Patient Responsibility"}]

    # Insurance match check
    names_match = primary_insurance.lower().split()[0] == eob_insurance_name.lower().split()[0] if eob_insurance_name else False
    match_status = "MATCH" if names_match else "MISMATCH"

    # EOB completeness
    pr_present = len(pr_codes) > 0
    pr_descriptions_available = all(p.get("description") and p["description"] != "Adjustment" for p in pr_codes)
    missing_elements = []
    if not pr_descriptions_available:
        missing_elements.append("PR Reason Code Description")
    if not pr_present:
        missing_elements.append("PR Reason Codes")
    if detail_lines and eob_data and len(eob_data) < len(detail_lines):
        missing_elements.append("Incomplete line-level detail coverage")

    completeness_pct = 100
    if missing_elements:
        completeness_pct = max(30, 100 - len(missing_elements) * 20)
    completeness_status = "COMPLETE" if completeness_pct >= 80 else "INCOMPLETE"

    # Determine recommendation
    if not eob_present:
        decision = "DENY"
        denial_code = "DN017" if "medicare" in primary_insurance.lower() else "DN018"
        denial_reason = f"EOB attachment not present. Cannot verify primary insurance payment from {primary_insurance}."
        action_required = f"Request EOB from {primary_insurance}"
    elif not names_match and eob_insurance_name:
        decision = "DENY"
        denial_code = "DN017" if "medicare" in primary_insurance.lower() else "DN018"
        denial_reason = f"Insurance name mismatch. Primary identified as {primary_insurance} but EOB shows {eob_insurance_name}."
        action_required = "Verify correct primary insurance and resubmit"
    elif completeness_status == "INCOMPLETE" and not pr_descriptions_available:
        decision = "DENY"
        denial_code = "DNEOB"
        denial_reason = f"EOB attachment incomplete - Primary EOB does not contain PR reason code descriptions."
        action_required = f"Request complete EOB with detailed PR reason descriptions from {primary_insurance}"
    else:
        decision = "APPROVE"
        denial_code = ""
        denial_reason = ""
        action_required = "Proceed to coordination rule application"

    next_steps = []
    if decision == "DENY":
        next_steps = [
            f"Contact {primary_insurance} for complete EOB documentation",
            "Request detailed explanation for adjustment codes",
            "Resubmit claim with complete EOB attachment",
        ]
    else:
        next_steps = [
            "Proceed to COB coordination rule determination",
            "Apply PR code logic for primary/secondary determination",
        ]

    return {
        "claim_metadata": {
            "claim_number": claim_number,
            "billed_amount": f"${billed_amount:.2f}",
            "classification": classification,
            "provider_name": provider_name,
            "state": state,
            "subscriber_id": subscriber_id,
        },
        "coverage_details": {
            "date_of_service": max_dos,
            "coverage_effective_date": primary_eff_date,
            "identified_primary_insurance": primary_insurance,
            "eob_insurance_name": eob_insurance_name or "N/A",
            "insurance_match_status": match_status,
            "pr_codes_identified": pr_codes,
            "eob_completeness_status": completeness_status,
        },
        "ai_reasoning": {
            "primary_insurance_identification": {
                "logic_applied": "DOS > Effective Date AND Term Date > DOS",
                "analysis": insurance_analysis,
                "primary_insurance_result": primary_insurance,
            },
            "eob_attachment_analysis": {
                "eob_present": eob_present,
                "eob_source": "COB_Image_Extraction",
                "attached_documents": [{"document_name": "COB_Image_Extraction", "data_type": "EOB Data"}] if eob_present else [],
            },
            "insurance_name_verification": {
                "identified_primary": primary_insurance,
                "eob_insurance_name": eob_insurance_name or "N/A",
                "names_match": names_match,
                "match_status": match_status,
                "verification_result": "Insurance names verified and matched" if names_match else f"MISMATCH - Primary is {primary_insurance} but EOB shows {eob_insurance_name}",
            },
            "eob_completeness_assessment": {
                "pr_codes_present": pr_present,
                "pr_reason_codes_documented": pr_present,
                "pr_descriptions_available": pr_descriptions_available,
                "adjustment_group_codes": adj_group_codes,
                "missing_elements": missing_elements,
                "completeness_score": f"{completeness_pct}%",
                "completeness_status": completeness_status,
            },
        },
        "recommendation": {
            "decision": decision,
            "denial_code": denial_code,
            "denial_reason": denial_reason,
            "action_required": action_required,
            "next_steps": next_steps,
        },
    }


def _fetch_cob_history(claim_id: str) -> list:
    """Fetch COB history from DB."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT sno, primary_insurance, effective_date, term_date FROM claim_cob_history WHERE claim_id = %s ORDER BY sno", (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return rows
    except Exception:
        return []


def _fetch_eob_data(claim_id: str) -> list:
    """Fetch EOB extraction from DB."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT sno, cpt, insurance_name, paid_amt, adj_grp_code, reason_code, pr_amount, image_ref FROM claim_eob_extraction WHERE claim_id = %s ORDER BY sno", (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return rows
    except Exception:
        return []


def _fetch_detail_lines(claim_id: str) -> list:
    """Fetch detail lines from DB."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT line_no, cpt, modifier, start_date, end_date, units, billed_amt, allowed_amt FROM claim_detail_lines WHERE claim_id = %s ORDER BY line_no", (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return rows
    except Exception:
        return []


def _store_cob_history(claim_id: str, cob_history: list):
    """Store COB history records."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM claim_cob_history WHERE claim_id = %s", (claim_id,))
    for record in cob_history:
        cur.execute("""
            INSERT INTO claim_cob_history (claim_id, sno, primary_insurance, effective_date, term_date)
            VALUES (%s, %s, %s, %s, %s)
        """, (claim_id, record.get("sno", 1), record.get("primary_insurance", ""), record.get("effective_date", ""), record.get("term_date", "")))
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
        """, (claim_id, record.get("sno", 1), record.get("cpt", ""), record.get("insurance_name", ""),
              record.get("paid_amt", 0), record.get("adj_grp_code", ""), record.get("reason_code", ""),
              record.get("pr_amount", 0), record.get("image_ref", "")))
    conn.commit()
    cur.close()
    conn.close()
