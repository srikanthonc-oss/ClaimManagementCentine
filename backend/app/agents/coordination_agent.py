"""Stage 5: Coordination of Benefits Rule Agent.

Analyzes EOB data, detail lines, denial details, COB history, and hold codes
to determine action type: Pay as Primary, Coordination (Secondary), or Deny.
"""
import json
import random
from app.agents.base_agent import call_bedrock, store_stage_output, parse_bedrock_json
from app.db.pool import get_db

STAGE_NUMBER = 5
STAGE_NAME = "Coordination Rule Application"
AGENT_NAME = "Coordination Agent"


def run_coordination_agent(claim: dict) -> dict:
    """Run coordination rule application for a claim."""
    claim_id = claim["id"]
    claim_number = claim.get("claim_number", "")
    billed_amount = float(claim.get("billed_amount", 0) or 0)

    # Fetch all required data from DB
    eob_data = _fetch_eob_data(claim_id)
    detail_lines = _fetch_or_generate_detail_lines(claim)
    cob_history = _fetch_cob_history(claim_id)
    denial_details = _fetch_denial_details(claim_id)
    hold_codes = _fetch_hold_codes(claim_id)
    header_detail = _fetch_header_detail(claim_id)

    # Try Bedrock for enhanced reasoning
    prompt_used = _build_prompt(claim, eob_data, detail_lines, cob_history, denial_details, hold_codes, header_detail)
    bedrock_result = _try_bedrock_with_prompt(prompt_used)

    if bedrock_result:
        output_data = bedrock_result
    else:
        output_data = _deterministic_full_output(claim, eob_data, detail_lines, cob_history, denial_details, hold_codes, header_detail)

    # Extract key fields for stage output
    final_summary = output_data.get("claim_analysis", {}).get("final_summary", {})
    rec_action = output_data.get("claim_analysis", {}).get("recommended_action_type", {})
    outcome = rec_action.get("action_type", "COORDINATION")
    confidence = "High" if "DENY" in outcome.upper() or "PRIMARY" in outcome.upper() else "Medium"
    reasoning = final_summary.get("next_action", rec_action.get("primary_recommendation", ""))

    # Store stage output
    store_stage_output(
        claim_id, STAGE_NUMBER, STAGE_NAME, AGENT_NAME,
        {"claim_number": claim_number, "eob_count": len(eob_data), "detail_lines": len(detail_lines)},
        output_data, outcome, confidence, reasoning,
        prompt_text=prompt_used
    )

    return output_data


def _build_prompt(claim: dict, eob_data: list, detail_lines: list, cob_history: list, denial_details: list, hold_codes: list, header_detail: dict) -> str:
    """Build the prompt for coordination analysis."""
    return f"""You are a healthcare COB coordination rule analyst. Analyze the coordination of benefits for this claim.

Claim: {claim.get('claim_number')}
Billed: ${claim.get('billed_amount', 0)}
Classification: {claim.get('classification')}
Hold Code: {claim.get('hold_code', 'N/A')}

Detail Lines: {json.dumps(detail_lines, default=str)}
EOB Data: {json.dumps(eob_data, default=str)}
COB History: {json.dumps(cob_history, default=str)}
Denial Details: {json.dumps(denial_details, default=str)}
Hold Codes: {json.dumps(hold_codes, default=str)}
Header Detail: {json.dumps(header_detail, default=str)}

Business Logic to identify Action Type:
1. Pay as Primary - If EOB contains PR 96, 204 or any reason codes indicating primary. Validate authorization.
2. Coordination - Pay as Secondary - If EOB contains PR reason as 1, 2, 3 then coordination action type.
3. Deny - If EOB contains CO 45 or Denial_Details has DNNPR.

Analyze:
- CPT line items with allowed, copay, coinsurance, OC paid, net amount
- Denial codes present
- Primary EOB details: PR codes, CO codes
- Authorization status
- Action type determination with AI reasoning

Return ONLY a valid JSON object matching this structure (no markdown, no code fences):
{{
  "claim_analysis": {{
    "claim_number": "{claim.get('claim_number')}",
    "analysis_type": "Healthcare COB Coordination",
    "claim_header_info": {{...}},
    "cpt_line_items": [{{line_number, cpt_code, modifier, units, start_date, end_date, billed_amount, allowed_amount, copay, coinsurance, oc_paid, net_amount}}],
    "cpt_summary": {{total_lines, total_billed_amount, total_allowed_amount, total_copay, total_coinsurance, total_oc_paid}},
    "denial_details": [{{claim_number, line_number, denial_code, denial_description, history, status}}],
    "primary_eob_details": [{{cpt_code, primary_insurance, pr_reason_code, pr_reason_description, co_adj_group_codes, paid_amount, pr_amount}}],
    "cob_history": [{{sno, primary_insurance, effective_date, term_date, coverage_status}}],
    "authorization_status": {{status, hold_code, hold_description, reason}},
    "reasoning_analysis": {{
      "primary_secondary_determination": {{determination, reason_code_identified, business_logic_applied, primary_insurance, secondary_insurance}},
      "eob_reason_codes_interpretation": [{{code, code_value, type, meaning, action}}],
      "authorization_validation": {{authorization_required, specialty, current_auth_status, impact, hold_reason}},
      "denial_logic": {{...}}
    }},
    "evidence_reviewed": [{{table, evidence}}],
    "recommended_action_type": {{
      "action_type": "PAY AS PRIMARY" or "COORDINATION - HOLD & REVIEW REQUIRED" or "DENY",
      "primary_recommendation": "...",
      "priority": "HIGH" or "MEDIUM" or "LOW",
      "line_specific_actions": [{{line_number, cpt_code, action, reason, allowed_amount, status}}],
      "hold_resolution_checklist": [{{task, status, priority}}]
    }},
    "final_summary": {{
      "claim_status": "HOLD" or "APPROVED" or "DENIED",
      "action_type": "...",
      "primary_insurance": "...",
      "secondary_insurance": "...",
      "total_denial_count": 0,
      "total_coordination_lines": 0,
      "next_action": "..."
    }}
  }}
}}"""


def _try_bedrock_with_prompt(prompt: str) -> dict:
    """Try to use Bedrock with the given prompt."""
    if not prompt:
        return None
    response = call_bedrock(prompt, max_tokens=4000)
    if response:
        print(f"[Coordination Agent] Bedrock raw response (first 200 chars): {response[:200]}")
    else:
        print("[Coordination Agent] Bedrock returned None")
    result = parse_bedrock_json(response)
    if not result:
        print("[Coordination Agent] Failed to parse JSON from Bedrock response")
    return result


def _deterministic_full_output(claim: dict, eob_data: list, detail_lines: list, cob_history: list, denial_details: list, hold_codes: list, header_detail: dict) -> dict:
    """Deterministic fallback producing the full structured output."""
    claim_number = claim.get("claim_number", "")
    billed_amount = float(claim.get("billed_amount", 0) or 0)
    hold_code = claim.get("hold_code", "") or ""
    specialty = claim.get("provider_specialty", "") or header_detail.get("specialty", "General")
    subscriber_id = claim.get("subscriber_id", "") or header_detail.get("member_id", "")
    par_status = claim.get("par_flag", "") or header_detail.get("par_status", "Par")
    recv_dt = claim.get("recv_dt", "") or header_detail.get("received_date", "")

    # Build CPT line items
    cpt_line_items = []
    total_billed = 0
    total_allowed = 0
    total_copay = 0
    total_coins = 0
    total_oc_paid = 0

    for line in detail_lines:
        billed = float(line.get("billed_amt", 0) or 0)
        allowed = float(line.get("allowed_amt", 0) or 0)
        copay = float(line.get("copay", 0) or 0)
        coins = float(line.get("coinsurance", 0) or 0)
        oc_paid = float(line.get("oc_paid", 0) or 0)
        net = oc_paid  # net amount = what OC paid

        total_billed += billed
        total_allowed += allowed
        total_copay += copay
        total_coins += coins
        total_oc_paid += oc_paid

        cpt_line_items.append({
            "line_number": line.get("line_no", 1),
            "cpt_code": str(line.get("cpt", "")),
            "modifier": str(line.get("modifier", "0")),
            "units": line.get("units", 1),
            "start_date": str(line.get("start_date", "")),
            "end_date": str(line.get("end_date", "")),
            "billed_amount": round(billed, 2),
            "allowed_amount": round(allowed, 2),
            "copay": round(copay, 2),
            "coinsurance": round(coins, 2),
            "oc_paid": round(oc_paid, 2),
            "net_amount": round(net, 2),
        })

    # Analyze EOB for PR/CO codes
    pr_codes_found = []
    co_codes_found = []
    primary_eob_details = []

    for eob in eob_data:
        reason_code = str(eob.get("reason_code", ""))
        adj_grp = str(eob.get("adj_grp_code", ""))
        pr_amount = float(eob.get("pr_amount", 0) or 0)
        paid_amt = float(eob.get("paid_amt", 0) or 0)
        insurance = str(eob.get("insurance_name", ""))

        if reason_code:
            pr_codes_found.append(reason_code)
        if "CO" in adj_grp:
            co_codes_found.append("CO")
        if "PR" in adj_grp:
            co_codes_found.append("PR")

        # Determine PR description
        pr_desc = "Coordination of Benefits Applicable" if reason_code in ("1", "2", "3") else \
                  "Non-covered charge" if reason_code in ("96", "204") else \
                  "Charge exceeds fee schedule" if reason_code == "45" else "Adjustment"

        primary_eob_details.append({
            "cpt_code": str(eob.get("cpt", "")),
            "primary_insurance": insurance,
            "pr_reason_code": reason_code,
            "pr_reason_description": pr_desc,
            "co_adj_group_codes": list(set(adj_grp.replace(",", " ").split())),
            "paid_amount": round(paid_amt, 2),
            "pr_amount": round(pr_amount, 2),
        })

    # COB history with status
    cob_entries = []
    primary_insurance = "Medicare"
    secondary_insurance = "N/A"
    for i, record in enumerate(cob_history):
        ins = record.get("primary_insurance", "Unknown")
        term = record.get("term_date", "")
        status = "Active" if not term or term > "2025-06-01" else "Expired"
        if i == 0:
            primary_insurance = ins
        elif i == 1:
            secondary_insurance = ins
        cob_entries.append({
            "sno": record.get("sno", i + 1),
            "primary_insurance": ins,
            "effective_date": record.get("effective_date", ""),
            "term_date": term,
            "coverage_status": status,
        })

    # Denial details
    denial_entries = []
    has_dnnpr = False
    for d in denial_details:
        code = str(d.get("reason_code", ""))
        if "DNNPR" in code.upper():
            has_dnnpr = True
        denial_entries.append({
            "claim_number": claim_number,
            "line_number": d.get("line_no", 1),
            "denial_code": code,
            "denial_description": "Denial - No Primary Reason" if "DNNPR" in code.upper() else f"Denial code {code}",
            "history": d.get("history", "N"),
            "status": "Active Denial",
        })

    # Determine action type
    has_primary_pr = any(c in ("96", "204") for c in pr_codes_found)
    has_secondary_pr = any(c in ("1", "2", "3") for c in pr_codes_found)
    has_co45 = "45" in pr_codes_found or any("CO" in str(eob.get("adj_grp_code", "")) and "45" in str(eob.get("reason_code", "")) for eob in eob_data)

    if has_co45 or has_dnnpr:
        action_type = "DENY"
        determination = "DENY"
        business_logic = "If EOB contains CO 45 or Denial_Details contains DNNPR, deny the claim"
    elif has_primary_pr:
        action_type = "PAY AS PRIMARY"
        determination = "PRIMARY"
        business_logic = "If EOB contains PR 96, 204 indicating primary, pay as primary"
    elif has_secondary_pr:
        action_type = "COORDINATION - HOLD & REVIEW REQUIRED"
        determination = "SECONDARY/COORDINATION"
        business_logic = "If EOB contains PR reason as 1, 2, 3 then consideration coordination action type"
    else:
        action_type = "COORDINATION - HOLD & REVIEW REQUIRED"
        determination = "SECONDARY/COORDINATION"
        business_logic = "Default to coordination when no clear primary/deny indicators"

    # Build line-specific actions
    line_actions = []
    denied_count = 0
    coord_count = 0
    for line in cpt_line_items:
        line_denied = any(d["line_number"] == line["line_number"] for d in denial_entries)
        if line_denied:
            denied_count += 1
            line_actions.append({
                "line_number": line["line_number"],
                "cpt_code": line["cpt_code"],
                "action": "DENY",
                "reason": "DNNPR denial code",
                "allowed_amount": line["allowed_amount"],
                "status": "FINAL DENY",
            })
        elif action_type == "PAY AS PRIMARY":
            line_actions.append({
                "line_number": line["line_number"],
                "cpt_code": line["cpt_code"],
                "action": "PAY AS PRIMARY",
                "reason": "PR 96/204 indicates primary",
                "allowed_amount": line["allowed_amount"],
                "status": "APPROVED",
            })
        else:
            coord_count += 1
            line_actions.append({
                "line_number": line["line_number"],
                "cpt_code": line["cpt_code"],
                "action": "HOLD FOR AUTHORIZATION REVIEW",
                "reason": "COBOC coordination pending",
                "allowed_amount": line["allowed_amount"],
                "status": "PENDING",
            })

    # Authorization status
    auth_status = {
        "status": "PENDING REVIEW" if hold_code else "APPROVED",
        "hold_code": hold_code,
        "hold_description": "Coordination of Benefits - On Coordination" if "COB" in hold_code else hold_code,
        "reason": "Authorization pending review" if hold_code else "No hold",
    }

    # EOB reason codes interpretation
    eob_interpretation = []
    for code in set(pr_codes_found):
        if code in ("1", "2", "3"):
            eob_interpretation.append({"code": "PR", "code_value": code, "type": "Primary Reason Code", "meaning": "Coordination of Benefits Applicable", "action": "Process as Secondary"})
        elif code in ("96", "204"):
            eob_interpretation.append({"code": "PR", "code_value": code, "type": "Primary Reason Code", "meaning": "Non-covered by primary", "action": "Pay as Primary"})
        elif code == "45":
            eob_interpretation.append({"code": "CO", "code_value": "45", "type": "Adjustment Code", "meaning": "Charge exceeds fee schedule", "action": "Deny"})
    if has_dnnpr:
        eob_interpretation.append({"code": "DNNPR", "code_value": "", "type": "Denial Code", "meaning": "Denial - No Primary Reason Available", "action": "Deny line item"})

    # Evidence reviewed
    evidence = [
        {"table": "Hold_Code_Info", "evidence": f"{hold_code} hold indicating coordination pending review" if hold_code else "No hold codes"},
        {"table": "Claim_Header", "evidence": f"{specialty} specialty; {par_status} status; Received {recv_dt}"},
        {"table": "Claim_Detail", "evidence": f"{len(detail_lines)} service lines with varying financial responsibility"},
        {"table": "Denial_Details", "evidence": f"{len(denial_entries)} denial(s) found" if denial_entries else "No denials"},
        {"table": "COBHistory", "evidence": f"{primary_insurance} primary; {secondary_insurance} secondary"},
        {"table": "COB_Image_Extraction", "evidence": f"PR Reason Code(s): {', '.join(pr_codes_found)}" if pr_codes_found else "No EOB data"},
    ]

    # Final summary
    total_denied_amt = sum(la["allowed_amount"] for la in line_actions if la["action"] == "DENY")
    coord_amt = sum(la["allowed_amount"] for la in line_actions if "HOLD" in la["action"] or "PRIMARY" in la["action"])

    return {
        "claim_analysis": {
            "claim_number": claim_number,
            "analysis_type": "Healthcare COB Coordination",
            "claim_header_info": {
                "member_id": subscriber_id,
                "specialty": specialty,
                "place_of_service": header_detail.get("place_of_service", "22"),
                "par_status": par_status,
                "received_date": recv_dt,
            },
            "cpt_line_items": cpt_line_items,
            "cpt_summary": {
                "total_lines": len(cpt_line_items),
                "total_billed_amount": round(total_billed, 2),
                "total_allowed_amount": round(total_allowed, 2),
                "total_copay": round(total_copay, 2),
                "total_coinsurance": round(total_coins, 2),
                "total_oc_paid": round(total_oc_paid, 2),
            },
            "denial_details": denial_entries,
            "primary_eob_details": primary_eob_details,
            "cob_history": cob_entries,
            "authorization_status": auth_status,
            "reasoning_analysis": {
                "primary_secondary_determination": {
                    "determination": determination,
                    "reason_code_identified": pr_codes_found[0] if pr_codes_found else "N/A",
                    "business_logic_applied": business_logic,
                    "primary_insurance": primary_insurance,
                    "secondary_insurance": secondary_insurance,
                },
                "eob_reason_codes_interpretation": eob_interpretation,
                "authorization_validation": {
                    "authorization_required": bool(hold_code),
                    "specialty": specialty,
                    "current_auth_status": auth_status["status"],
                    "impact": "HOLD - Claim cannot be processed until authorized" if hold_code else "No hold",
                    "hold_reason": f"{hold_code} coordination hold in effect" if hold_code else "None",
                },
                "denial_logic": {f"line_{d['line_number']}_cpt_{cpt_line_items[d['line_number']-1]['cpt_code'] if d['line_number'] <= len(cpt_line_items) else 'unknown'}": {"denial_code": d["denial_code"], "action": "DENY", "reason": d["denial_description"]} for d in denial_entries} if denial_entries else {},
            },
            "evidence_reviewed": evidence,
            "recommended_action_type": {
                "action_type": action_type,
                "primary_recommendation": "Do Not Process Yet - Authorization Pending" if "HOLD" in action_type else "Process claim" if "PRIMARY" in action_type else "Deny claim",
                "priority": "HIGH",
                "line_specific_actions": line_actions,
                "hold_resolution_checklist": [
                    {"task": f"Complete authorization review for {specialty} services", "status": "PENDING", "priority": "HIGH"},
                    {"task": f"Confirm {primary_insurance} primary adjudication for all applicable CPTs", "status": "PENDING", "priority": "HIGH"},
                    {"task": "Validate patient coverage active on date of service", "status": "PENDING", "priority": "HIGH"},
                    {"task": f"Release {hold_code} hold once authorization confirmed", "status": "PENDING", "priority": "HIGH"},
                ] if "HOLD" in action_type else [],
            },
            "final_summary": {
                "claim_status": "HOLD" if "HOLD" in action_type else "APPROVED" if "PRIMARY" in action_type else "DENIED",
                "action_type": f"{'Coordination (Secondary)' if 'COORDINATION' in action_type else 'Pay as Primary' if 'PRIMARY' in action_type else 'Deny'} - {'Pending Authorization' if hold_code else 'Ready'}",
                "primary_insurance": primary_insurance,
                "secondary_insurance": secondary_insurance,
                "total_denial_count": denied_count,
                "total_denied_amount": round(total_denied_amt, 2),
                "total_coordination_lines": coord_count,
                "estimated_secondary_payment_pending": round(coord_amt, 2),
                "next_action": "Complete authorization review and release hold" if "HOLD" in action_type else "Process payment" if "PRIMARY" in action_type else "Issue denial",
            },
        }
    }


# ─── Data Fetching Helpers ────────────────────────────────────────────────────

def _fetch_eob_data(claim_id: str) -> list:
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


def _fetch_or_generate_detail_lines(claim: dict) -> list:
    claim_id = claim["id"]
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM claim_detail_lines WHERE claim_id = %s", (claim_id,))
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    if count > 0:
        return _fetch_detail_lines(claim_id)
    else:
        return _generate_detail_lines(claim)


def _fetch_detail_lines(claim_id: str) -> list:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT line_no, cpt, modifier, start_date, end_date, units, billed_amt, allowed_amt, copay, coinsurance, oc_paid FROM claim_detail_lines WHERE claim_id = %s ORDER BY line_no", (claim_id,))
    cols = [desc[0] for desc in cur.description]
    rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    cur.close()
    conn.close()
    return rows


def _fetch_cob_history(claim_id: str) -> list:
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


def _fetch_denial_details(claim_id: str) -> list:
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT line_no, history, reason_code FROM claim_denial_details WHERE claim_id = %s ORDER BY line_no", (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return rows
    except Exception:
        return []


def _fetch_hold_codes(claim_id: str) -> list:
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT line_no, hold_code, history, reason, description FROM claim_hold_codes WHERE claim_id = %s ORDER BY line_no", (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return rows
    except Exception:
        return []


def _fetch_header_detail(claim_id: str) -> dict:
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT member_id, specialty, place_of_service, par_status, received_date FROM claim_header_detail WHERE claim_id = %s", (claim_id,))
        cols = [desc[0] for desc in cur.description]
        row = cur.fetchone()
        cur.close()
        conn.close()
        return dict(zip(cols, row)) if row else {}
    except Exception:
        return {}


def _generate_detail_lines(claim: dict) -> list:
    """Generate detail lines if none exist."""
    claim_id = claim["id"]
    claim_number = claim.get("claim_number", "")
    billed_amount = float(claim.get("billed_amount", 0) or 0)
    seed_val = sum(ord(c) for c in claim_number) if claim_number else 42
    rng = random.Random(seed_val)

    num_lines = 3 if billed_amount > 1000 else 2 if billed_amount > 500 else 1
    cpt_codes = ["93000", "71046", "99215", "99213", "99214", "73721"]
    modifiers = ["95", "0", "25", "", "26", "TC"]
    lines = []
    remaining = billed_amount

    for i in range(num_lines):
        if i == num_lines - 1:
            line_billed = remaining
        else:
            line_billed = round(remaining * rng.uniform(0.2, 0.4), 2)
            remaining -= line_billed

        allowed = round(line_billed * rng.uniform(0.55, 0.75), 2)
        copay = round(rng.uniform(20, 50), 2) if i == 0 else round(rng.uniform(25, 45), 2)
        coins = round(allowed * rng.uniform(0.02, 0.18), 2)
        oc_paid = round(allowed - copay - coins, 2)
        oc_paid = max(0, oc_paid)

        lines.append({
            "line_no": i + 1,
            "cpt": cpt_codes[(seed_val + i) % len(cpt_codes)],
            "modifier": modifiers[(seed_val + i) % len(modifiers)],
            "start_date": claim.get("recv_dt", "06/15/2025") or "06/15/2025",
            "end_date": claim.get("recv_dt", "06/15/2025") or "06/15/2025",
            "units": rng.randint(1, 4),
            "billed_amt": line_billed,
            "allowed_amt": allowed,
            "copay": copay,
            "coinsurance": coins,
            "oc_paid": oc_paid,
        })

    # Store in DB
    _store_detail_lines(claim_id, lines)
    return lines


def _store_detail_lines(claim_id: str, lines: list):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM claim_detail_lines WHERE claim_id = %s", (claim_id,))
    for line in lines:
        cur.execute("""
            INSERT INTO claim_detail_lines (claim_id, line_no, cpt, modifier, start_date, end_date, units, billed_amt, allowed_amt, copay, coinsurance, oc_paid)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (claim_id, line.get("line_no"), line.get("cpt"), line.get("modifier"), line.get("start_date"), line.get("end_date"), line.get("units"), line.get("billed_amt"), line.get("allowed_amt"), line.get("copay"), line.get("coinsurance"), line.get("oc_paid")))
    conn.commit()
    cur.close()
    conn.close()
