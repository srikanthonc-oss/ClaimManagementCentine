"""Stage 6: COB Calculation Agent.

Applies the 3-condition COB formula per line:
1. If OC Paid > Total PR: Non-Covered = (OC Paid - Allowed) - PR Amount
2. If OC Paid < Total PR: Non-Covered = 0, Net = 0
3. If OC Paid = 0: Non-Covered = 0, Allowed = PR Amount
"""
import json
from app.agents.base_agent import call_bedrock, store_stage_output, parse_bedrock_json
from app.db.pool import get_db

STAGE_NUMBER = 6
STAGE_NAME = "COB Calculation"
AGENT_NAME = "COB Calculation Agent"


def run_cob_calculation_agent(claim: dict) -> dict:
    """Run COB calculation for a claim."""
    claim_id = claim["id"]
    claim_number = claim.get("claim_number", "")
    billed_amount = float(claim.get("billed_amount", 0) or 0)

    # Fetch data from DB
    detail_lines = _fetch_detail_lines(claim_id)
    eob_data = _fetch_eob_data(claim_id)
    cob_history = _fetch_cob_history(claim_id)
    header_detail = _fetch_header_detail(claim_id)
    denial_details = _fetch_denial_details(claim_id)

    # Try Bedrock
    prompt_used = _build_prompt(claim, detail_lines, eob_data, cob_history, header_detail, denial_details)
    bedrock_result = _try_bedrock_with_prompt(prompt_used)

    if bedrock_result:
        output_data = bedrock_result
    else:
        output_data = _deterministic_full_output(claim, detail_lines, eob_data, cob_history, header_detail, denial_details)

    # Extract key fields
    metadata = output_data.get("claim_analysis", {}).get("metadata", {})
    totals = output_data.get("claim_analysis", {}).get("claim_totals", {})
    outcome = metadata.get("overall_status", "Calculated")
    confidence = "High" if metadata.get("lines_valid", 0) == metadata.get("lines_valid", 0) + metadata.get("lines_requiring_review", 0) else "Medium"
    reasoning = f"Total potential overpayment: ${metadata.get('total_potential_overpayment', 0):.2f}" if metadata.get("total_potential_overpayment") else "COB calculation complete"

    store_stage_output(
        claim_id, STAGE_NUMBER, STAGE_NAME, AGENT_NAME,
        {"claim_number": claim_number, "billed_amount": billed_amount},
        output_data, outcome, confidence, reasoning,
        prompt_text=prompt_used
    )

    return output_data


def _build_prompt(claim: dict, detail_lines: list, eob_data: list, cob_history: list, header_detail: dict, denial_details: list) -> str:
    return f"""You are a healthcare COB calculation specialist. Apply the 3-condition COB formula for this claim.

Claim: {claim.get('claim_number')}
Billed: ${claim.get('billed_amount', 0)}
Hold Code: {claim.get('hold_code', 'N/A')}

Detail Lines: {json.dumps(detail_lines, default=str)}
EOB Data: {json.dumps(eob_data, default=str)}
COB History: {json.dumps(cob_history, default=str)}
Header: {json.dumps(header_detail, default=str)}
Denial Details: {json.dumps(denial_details, default=str)}

3-Condition COB Formula (apply per line):
1. If OC Paid > Total PR Amount: Not Covered = (OC Paid - Allowed) - PR Amount
2. If OC Paid < Total PR Amount: Not Covered = 0, Net Amount = 0
3. If OC Paid = 0 (empty): Not Covered = 0, Allowed Amount = PR Amount

For each line: identify which condition applies, show calculation steps, determine not_covered_amount and net_amount.
If formula yields negative, cap at $0 and flag as "Review Required" (overpayment).

Return ONLY valid JSON with this structure (no markdown):
{{
  "claim_analysis": {{
    "claim_header": {{claim_number, member_id, specialty, place_of_service, network_status, received_date, hold_reason, hold_description}},
    "cob_summary": {{primary_insurance, primary_effective_date, primary_term_date, secondary_insurance, secondary_term_date, secondary_active}},
    "claim_lines": [{{line_number, cpt_code, modifier, start_date, end_date, units, billed_amount, allowed_amount, copay, coinsurance, oc_paid, primary_insurance, primary_paid_amount, pr_amount, adjustment_group_code, reason_code, cob_calculation: {{condition, condition_details, formula_applied, calculation_steps, not_covered_amount, net_amount, final_allowed_amount, final_adjustment, status, notes}}}}],
    "claim_totals": {{total_billed_amount, total_allowed_amount, total_copay, total_coinsurance, total_oc_paid, total_pr_amount, total_not_covered_amount, total_adjustment}},
    "financial_summary": {{cpt_line_detail: [{{cpt, allowed_amt, copay, coins, net_amt, oc_paid}}], eob_summary: [{{cpt, primary_insurance, paid_amt, adj_group_code, reason, pr_amount}}]}},
    "outcome": {{final_calculations: [{{cpt, final_allowed_amt, final_non_covered_amt, final_adjustment, secondary_paid, status}}]}},
    "recommendations": [{{priority, category, action, details}}],
    "metadata": {{report_type, calculation_method, total_potential_overpayment, lines_requiring_review, lines_valid, overall_status}}
  }}
}}"""


def _try_bedrock_with_prompt(prompt: str) -> dict:
    if not prompt:
        return None
    response = call_bedrock(prompt, max_tokens=4000)
    if response:
        print(f"[COB Calc Agent] Bedrock response (first 200): {response[:200]}")
    else:
        print("[COB Calc Agent] Bedrock returned None")
    result = parse_bedrock_json(response)
    if not result:
        print("[COB Calc Agent] Failed to parse JSON")
    return result


def _deterministic_full_output(claim: dict, detail_lines: list, eob_data: list, cob_history: list, header_detail: dict, denial_details: list) -> dict:
    claim_number = claim.get("claim_number", "")
    hold_code = claim.get("hold_code", "") or ""
    subscriber_id = claim.get("subscriber_id", "") or header_detail.get("member_id", "")
    specialty = claim.get("provider_specialty", "") or header_detail.get("specialty", "")
    par_status = claim.get("par_flag", "") or header_detail.get("par_status", "Par")
    recv_dt = claim.get("recv_dt", "") or header_detail.get("received_date", "")
    pos = header_detail.get("place_of_service", "22")

    # COB summary
    primary_ins = "Medicare"
    primary_eff = ""
    primary_term = ""
    secondary_ins = "N/A"
    secondary_term = ""
    secondary_active = False

    if cob_history:
        if len(cob_history) >= 1:
            primary_ins = cob_history[0].get("primary_insurance", "Medicare")
            primary_eff = cob_history[0].get("effective_date", "")
            primary_term = cob_history[0].get("term_date", "")
        if len(cob_history) >= 2:
            secondary_ins = cob_history[1].get("primary_insurance", "N/A")
            secondary_term = cob_history[1].get("term_date", "")
            secondary_active = secondary_term > "2025-06-01" if secondary_term else False

    # Build EOB lookup by line/cpt
    eob_by_line = {}
    for eob in eob_data:
        cpt = str(eob.get("cpt", ""))
        eob_by_line[cpt] = eob

    # Process each line with COB formula
    claim_lines = []
    total_billed = 0
    total_allowed = 0
    total_copay = 0
    total_coins = 0
    total_oc_paid = 0
    total_pr = 0
    total_not_covered = 0
    total_adjustment = 0
    cpt_line_detail = []
    eob_summary = []
    final_calcs = []
    lines_review = 0
    lines_valid = 0

    for line in detail_lines:
        line_no = line.get("line_no", 1)
        cpt = str(line.get("cpt", ""))
        modifier = str(line.get("modifier", "0"))
        billed = float(line.get("billed_amt", 0) or 0)
        allowed = float(line.get("allowed_amt", 0) or 0)
        copay = float(line.get("copay", 0) or 0)
        coins = float(line.get("coinsurance", 0) or 0)
        oc_paid = float(line.get("oc_paid", 0) or 0)

        # Get PR amount from EOB or calculate
        eob_record = eob_by_line.get(cpt, {})
        pr_amount = float(eob_record.get("pr_amount", 0) or 0)
        if not pr_amount:
            pr_amount = copay + coins  # fallback
        adj_grp = str(eob_record.get("adj_grp_code", "CO, PR"))
        reason_code = str(eob_record.get("reason_code", ""))

        # Check denial
        denial_code = ""
        for d in denial_details:
            if d.get("line_no") == line_no:
                denial_code = str(d.get("reason_code", ""))

        # Apply 3-condition COB formula
        if oc_paid == 0:
            condition = "OC Paid = Empty"
            condition_details = "OC Paid is $0"
            formula = "if OC Paid = \"\", Not covered amount = 0, Allowed Amount = PR Amount"
            calc_steps = [f"OC Paid Amount: $0", f"PR Amount: ${pr_amount:.2f}", "Condition: OC Paid is empty/zero", f"Allowed Amount = PR Amount = ${pr_amount:.2f}"]
            not_covered = 0
            net_amount = pr_amount
            final_allowed = pr_amount
            final_adj = 0
            status = "Valid"
            notes = "No OC payment - using PR amount as allowed"
        elif oc_paid < pr_amount:
            condition = "OC Paid < Total PR Amount"
            condition_details = f"{oc_paid:.2f} < {pr_amount:.2f}"
            formula = "if OC Paid < Total PR amount, Not covered amount = 0, Net amount=0"
            calc_steps = [f"OC Paid Amount: ${oc_paid:.2f}", f"Total PR Amount: ${pr_amount:.2f}", f"Comparison: ${oc_paid:.2f} < ${pr_amount:.2f} = TRUE"]
            not_covered = 0
            net_amount = 0
            final_allowed = allowed
            final_adj = 0
            status = "Valid"
            notes = "Secondary pays less than primary - no over-payment issue"
        else:
            condition = "OC Paid > Total PR Amount"
            condition_details = f"{oc_paid:.2f} > {pr_amount:.2f}"
            formula = "if OC Paid > Total PR amount, Not covered amount = (OC Paid Amount - Allowed amount) - PR Amount"
            raw_calc = (oc_paid - allowed) - pr_amount
            calc_steps = [
                f"OC Paid Amount: ${oc_paid:.2f}",
                f"Total PR Amount: ${pr_amount:.2f}",
                f"Comparison: ${oc_paid:.2f} > ${pr_amount:.2f} = TRUE",
                f"Not Covered Amount = (${oc_paid:.2f} - ${allowed:.2f}) - ${pr_amount:.2f}",
                f"Not Covered Amount = ${oc_paid - allowed:.2f} - ${pr_amount:.2f}",
                f"Not Covered Amount = ${raw_calc:.2f}",
            ]
            if raw_calc < 0:
                calc_steps.append(f"Capped at: $0 (negative values set to zero)")
                not_covered = 0
                status = "Review Required"
                notes = "Secondary overpayment detected - potential recoupment needed"
                lines_review += 1
            else:
                not_covered = round(raw_calc, 2)
                status = "Valid"
                notes = "Non-covered amount calculated"
                lines_valid += 1
            net_amount = 0
            final_allowed = allowed
            final_adj = round(raw_calc, 2)

        if status == "Valid" and not_covered == 0 and final_adj == 0:
            lines_valid += 1

        total_billed += billed
        total_allowed += allowed
        total_copay += copay
        total_coins += coins
        total_oc_paid += oc_paid
        total_pr += pr_amount
        total_not_covered += not_covered
        total_adjustment += final_adj

        claim_lines.append({
            "line_number": line_no,
            "cpt_code": cpt,
            "modifier": modifier,
            "start_date": str(line.get("start_date", "")),
            "end_date": str(line.get("end_date", "")),
            "units": line.get("units", 1),
            "billed_amount": round(billed, 2),
            "allowed_amount": round(allowed, 2),
            "copay": round(copay, 2),
            "coinsurance": round(coins, 2),
            "oc_paid": round(oc_paid, 2),
            "primary_insurance": primary_ins,
            "primary_paid_amount": round(oc_paid, 2),
            "pr_amount": round(pr_amount, 2),
            "adjustment_group_code": adj_grp,
            "reason_code": reason_code,
            "denial_reason": denial_code,
            "cob_calculation": {
                "condition": condition,
                "condition_details": condition_details,
                "formula_applied": formula,
                "calculation_steps": calc_steps,
                "not_covered_amount": round(not_covered, 2),
                "net_amount": round(net_amount, 2),
                "final_allowed_amount": round(final_allowed, 2),
                "final_adjustment": round(final_adj, 2),
                "status": status,
                "notes": notes,
            },
        })

        cpt_line_detail.append({"cpt": cpt, "allowed_amt": round(allowed, 2), "copay": round(copay, 2), "coins": round(coins, 2), "net_amt": round(oc_paid, 2), "oc_paid": round(oc_paid, 2)})
        eob_summary.append({"cpt": cpt, "primary_insurance": primary_ins, "paid_amt": round(oc_paid, 2), "adj_group_code": adj_grp, "reason": reason_code, "pr_amount": round(pr_amount, 2)})
        final_calcs.append({"cpt": cpt, "final_allowed_amt": round(final_allowed, 2), "final_non_covered_amt": round(not_covered, 2), "final_adjustment": round(final_adj, 2), "secondary_paid": round(oc_paid, 2), "status": status})

    # Recommendations
    recommendations = []
    if hold_code:
        recommendations.append({"priority": "High", "category": "Hold Status Resolution", "action": f"Clear {hold_code} hold once COB adjudication confirmed", "details": f"Current hold: {hold_code}"})
    if any(d.get("denial_reason") for d in claim_lines):
        recommendations.append({"priority": "High", "category": "Denial Code Verification", "action": "Verify denial code accuracy", "details": "Denial present but OC payment recorded"})
    overpayment = abs(total_adjustment) if total_adjustment < 0 else 0
    if overpayment > 0:
        recommendations.append({"priority": "Critical", "category": "Overpayment Recovery", "action": f"Request recoupment: ${overpayment:.2f}", "details": f"{lines_review} lines with overpayment"})
    recommendations.append({"priority": "Medium", "category": "Final Posting", "action": "Post claim with contingency reserve", "details": "Flag for COB auditing team review"})

    return {
        "claim_analysis": {
            "claim_header": {
                "claim_number": claim_number,
                "member_id": subscriber_id,
                "specialty": specialty,
                "place_of_service": pos,
                "network_status": par_status,
                "received_date": recv_dt,
                "hold_reason": hold_code,
                "hold_description": "Authorization pending review" if hold_code else "",
            },
            "cob_summary": {
                "primary_insurance": primary_ins,
                "primary_effective_date": primary_eff,
                "primary_term_date": primary_term,
                "secondary_insurance": secondary_ins,
                "secondary_term_date": secondary_term,
                "secondary_active": secondary_active,
            },
            "claim_lines": claim_lines,
            "claim_totals": {
                "total_billed_amount": round(total_billed, 2),
                "total_allowed_amount": round(total_allowed, 2),
                "total_copay": round(total_copay, 2),
                "total_coinsurance": round(total_coins, 2),
                "total_oc_paid": round(total_oc_paid, 2),
                "total_pr_amount": round(total_pr, 2),
                "total_not_covered_amount": round(total_not_covered, 2),
                "total_adjustment": round(total_adjustment, 2),
            },
            "financial_summary": {"cpt_line_detail": cpt_line_detail, "eob_summary": eob_summary},
            "outcome": {"final_calculations": final_calcs},
            "recommendations": recommendations,
            "metadata": {
                "report_type": "Healthcare COB Calculation Analysis",
                "calculation_method": "3-Condition COB Formula",
                "total_potential_overpayment": round(overpayment, 2),
                "lines_requiring_review": lines_review,
                "lines_valid": lines_valid,
                "overall_status": "Requires Management Review" if lines_review > 0 else "Valid - Ready for Posting",
            },
        }
    }


# ─── Data Fetching ────────────────────────────────────────────────────────────

def _fetch_detail_lines(claim_id: str) -> list:
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT line_no, cpt, modifier, start_date, end_date, units, billed_amt, allowed_amt, copay, coinsurance, oc_paid FROM claim_detail_lines WHERE claim_id = %s ORDER BY line_no", (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close(); conn.close()
        return rows
    except Exception:
        return []

def _fetch_eob_data(claim_id: str) -> list:
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT sno, cpt, insurance_name, paid_amt, adj_grp_code, reason_code, pr_amount FROM claim_eob_extraction WHERE claim_id = %s ORDER BY sno", (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close(); conn.close()
        return rows
    except Exception:
        return []

def _fetch_cob_history(claim_id: str) -> list:
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT sno, primary_insurance, effective_date, term_date FROM claim_cob_history WHERE claim_id = %s ORDER BY sno", (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close(); conn.close()
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
        cur.close(); conn.close()
        return dict(zip(cols, row)) if row else {}
    except Exception:
        return {}

def _fetch_denial_details(claim_id: str) -> list:
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT line_no, history, reason_code FROM claim_denial_details WHERE claim_id = %s ORDER BY line_no", (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close(); conn.close()
        return rows
    except Exception:
        return []
