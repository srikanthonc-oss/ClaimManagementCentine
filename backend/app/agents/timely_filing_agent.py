"""Stage 4: Timely Filing Agent.

Reads claim's days_aged, state, recv_dt, detail lines, COB history, and hold codes.
Calculates date difference, applies state-specific filing rules, and validates COB coverage.
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
    "KY": 365, "OH": 365, "IN": 365, "TN": 365, "GA": 365,
    "FL": 365, "TX": 365, "CA": 365, "NY": 365, "PA": 365,
    "IL": 365, "MI": 365, "VA": 365, "NC": 365, "WV": 365,
    "DEFAULT": 365,
}

def run_timely_filing_agent(claim: dict) -> dict:
    """Run timely filing check for a claim."""
    claim_id = claim["id"]
    claim_number = claim.get("claim_number", "")
    days_aged = claim.get("days_aged", 0) or 0
    state = claim.get("state", "OH") or "OH"
    recv_dt = claim.get("recv_dt", "") or ""

    # Get received_date from claim_header_detail (reference data) if available
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT received_date FROM claim_header_detail WHERE claim_id = %s", (claim_id,))
        hdr_row = cur.fetchone()
        cur.close()
        conn.close()
        if hdr_row and hdr_row[0]:
            recv_dt = hdr_row[0]
    except Exception:
        pass

    # Fetch detail lines for DOS calculation
    detail_lines = _fetch_detail_lines(claim_id)

    # Fetch COB history for coverage validation
    cob_history = _fetch_cob_history(claim_id)

    # Fetch hold codes
    hold_codes = _fetch_hold_codes(claim_id)

    # Try Bedrock for enhanced reasoning
    prompt_used = _build_prompt(claim, detail_lines, cob_history, hold_codes, recv_dt)
    bedrock_result = _try_bedrock_with_prompt(prompt_used)

    if bedrock_result:
        output_data = bedrock_result
    else:
        # Deterministic fallback — generate the full structured output
        output_data = _deterministic_full_output(claim, detail_lines, cob_history, hold_codes, recv_dt)

    # Always override DOS-to-received with our own calculation (LLM often gets dates wrong)
    try:
        max_end_date = ""
        if detail_lines:
            for line in detail_lines:
                end_dt = str(line.get("end_date", ""))
                if end_dt and end_dt > max_end_date:
                    max_end_date = end_dt
        if max_end_date and recv_dt:
            from datetime import datetime as dt_parse
            date_fmts = ["%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d"]
            dos_d = None
            recv_d = None
            for fmt in date_fmts:
                if not dos_d:
                    try: dos_d = dt_parse.strptime(max_end_date, fmt)
                    except: pass
                if not recv_d:
                    try: recv_d = dt_parse.strptime(recv_dt, fmt)
                    except: pass
            if dos_d and recv_d:
                correct_diff = (recv_d - dos_d).days
                filing_limit = STATE_FILING_LIMITS.get(claim.get("state", "OH") or "OH", 365)
                is_compliant = correct_diff <= filing_limit
                # Patch all relevant sections in the output
                claim_analysis = output_data.get("claim_analysis", {})
                tf_calc = claim_analysis.get("timely_filing_calculation", {})
                if tf_calc:
                    tf_calc["dos_to_received_difference_days"] = correct_diff
                    tf_calc["dos_to_received_difference_status"] = "COMPLIANT" if is_compliant else "NON_COMPLIANT"
                tf_status = claim_analysis.get("timely_filing_status", {})
                if tf_status:
                    tf_status["compliance"] = is_compliant
                    tf_status["status"] = "WITHIN_TIMELY_FILING_LIMITS" if is_compliant else "EXCEEDED_TIMELY_FILING_LIMITS"
                ai_reasoning = claim_analysis.get("ai_reasoning", {})
                if ai_reasoning.get("date_difference_status"):
                    ai_reasoning["date_difference_status"]["finding"] = "COMPLIANT" if is_compliant else "NON_COMPLIANT"
                    ai_reasoning["date_difference_status"]["details"] = f"The claim was received {correct_diff} days after the latest date of service ({max_end_date}). This {'falls well within' if is_compliant else 'exceeds'} the standard {filing_limit}-day timely filing requirement."
                if ai_reasoning.get("ky_state_logic"):
                    ai_reasoning["ky_state_logic"]["date_difference"] = correct_diff
                    ai_reasoning["ky_state_logic"]["meets_requirement"] = is_compliant
                final_rec = claim_analysis.get("final_recommendation", {})
                if final_rec:
                    final_rec["timely_filing_recommendation"] = "APPROVE" if is_compliant else "DENY"
                    final_rec["timely_filing_reason"] = f"Received {correct_diff} days after DOS - {'within' if is_compliant else 'exceeds'} {filing_limit}-day limit"
                    if is_compliant:
                        final_rec["overall_status"] = "APPROVED"
    except Exception:
        pass

    # Extract key fields for stage output storage
    timely_status = output_data.get("claim_analysis", {}).get("timely_filing_status", {})
    final_rec = output_data.get("claim_analysis", {}).get("final_recommendation", {})
    outcome = final_rec.get("timely_filing_recommendation", "APPROVE")
    confidence = "High" if timely_status.get("compliance", True) else "Low"
    reasoning = final_rec.get("timely_filing_reason", "")

    # Store header detail
    claim_info = output_data.get("claim_analysis", {}).get("claim_information", {})
    header_detail = {
        "member_id": claim_info.get("subscriber_id", claim.get("subscriber_id", "")),
        "specialty": claim_info.get("provider_specialty", claim.get("provider_specialty", "")),
        "place_of_service": claim_info.get("place_of_service", "22"),
        "par_status": claim_info.get("par_status", claim.get("par_flag", "Y")),
        "received_date": claim_info.get("received_date", recv_dt),
    }
    _store_header_detail(claim_id, header_detail)

    # Store stage output
    store_stage_output(
        claim_id, STAGE_NUMBER, STAGE_NAME, AGENT_NAME,
        {"days_aged": days_aged, "state": state, "recv_dt": recv_dt},
        output_data, outcome, confidence, reasoning,
        prompt_text=prompt_used
    )

    return output_data


def _build_prompt(claim: dict, detail_lines: list, cob_history: list, hold_codes: list, recv_dt: str) -> str:
    """Build the prompt for timely filing analysis."""
    filing_limit = STATE_FILING_LIMITS.get(claim.get("state", "OH"), 365)

    return f"""You are a healthcare claims timely filing analyst. Analyze timely filing and COB coverage for this claim.

Claim: {claim.get('claim_number')}
Subscriber ID: {claim.get('subscriber_id', 'N/A')}
Provider Specialty: {claim.get('provider_specialty', 'N/A')}
PAR Status: {claim.get('par_flag', 'N/A')}
Received Date: {recv_dt or 'N/A'}
Days Aged: {claim.get('days_aged', 0)}
State: {claim.get('state', 'OH')}
State Filing Limit: {filing_limit} days
Hold Code: {claim.get('hold_code', 'N/A')}
Billed Amount: ${claim.get('billed_amount', 0)}

Detail Lines: {json.dumps(detail_lines, default=str)}
COB History: {json.dumps(cob_history, default=str)}
Hold Codes: {json.dumps(hold_codes, default=str)}

Business Logic:

If (Par_Flag='Par' or Denial = "TFLDN")

	Calculate the Date difference between 'End Date' and 'recv_dt'.
	Date Diff <= 365 days for KY state follow next step. if Date Diff >365. Deny as "TFLDN"

Return ONLY this exact JSON structure:
{{
  "claim_analysis": {{
    "claim_information": {{
      "claim_number": "{claim.get('claim_number')}",
      "subscriber_id": "{claim.get('subscriber_id', 'N/A')}",
      "provider_specialty": "{claim.get('provider_specialty', 'N/A')}",
      "par_status": "{claim.get('par_flag', 'N/A')}",
      "received_date": "{recv_dt or 'N/A'}"
    }},
    "timely_filing_calculation": {{
      "date_of_service": {{
        "maximum_end_date": "<latest end date from detail lines>",
        "line_number": "<line with latest date>"
      }},
      "received_date": "{recv_dt or 'N/A'}",
      "dos_to_received_difference_days": <int>,
      "dos_to_received_difference_status": "COMPLIANT" or "NON_COMPLIANT"
    }},
    "timely_filing_status": {{
      "state": "{claim.get('state', 'OH')}",
      "standard_requirement_days": {filing_limit},
      "status": "WITHIN_TIMELY_FILING_LIMITS" or "EXCEEDED_TIMELY_FILING_LIMITS",
      "compliance": true or false
    }},
    "ai_reasoning": {{
      "date_difference_status": {{
        "finding": "COMPLIANT" or "NON_COMPLIANT",
        "details": "<explanation>",
        "margin_of_safety_days": <int>
      }},
      "ky_state_logic": {{
        "applicable": true,
        "date_difference": <int>,
        "threshold": {filing_limit},
        "meets_requirement": true or false,
        "finding": "<explanation>"
      }},
      "cob_validation": {{
        "concern_level": "NONE" or "POTENTIAL_ISSUE",
        "details": {{
          "primary_insurance": "<name>",
          "primary_term_date": "<date>",
          "secondary_insurance": "<name or N/A>",
          "secondary_term_date": "<date or N/A>",
          "issue_description": "<description or N/A>",
          "recommendation": "<action>"
        }}
      }}
    }},
    "claim_details": {{
      "line_items": [<detail lines with line_number, cpt, modifier, start_date, end_date, units, billed_amount, allowed_amount>]
    }},
    "hold_and_denial_status": {{
      "hold_code": "<code>",
      "hold_description": "<description>",
      "denial_line": "<line>",
      "denial_reason_code": "<code>",
      "denial_history": "<Y/N>"
    }},
    "final_recommendation": {{
      "timely_filing_recommendation": "APPROVE" or "DENY",
      "timely_filing_reason": "<reason>",
      "cob_resolution_required": true or false,
      "cob_action_items": ["<action1>", "<action2>"],
      "overall_status": "APPROVED" or "PENDING_COB_RESOLUTION" or "DENIED_TIMELY_FILING",
      "priority": "HIGH" or "MEDIUM" or "LOW"
    }}
  }}
}}

IMPORTANT: Return ONLY the JSON object. No markdown, no code fences, no text before or after."""


def _try_bedrock_with_prompt(prompt: str) -> dict:
    """Try to use Bedrock with the given prompt."""
    if not prompt:
        return None
    response = call_bedrock(prompt, max_tokens=3000)
    if response:
        print(f"[Timely Filing Agent] Bedrock raw response (first 200 chars): {response[:200]}")
    else:
        print("[Timely Filing Agent] Bedrock returned None")
    result = parse_bedrock_json(response)
    if not result:
        print("[Timely Filing Agent] Failed to parse JSON from Bedrock response")
    return result


def _deterministic_full_output(claim: dict, detail_lines: list, cob_history: list, hold_codes: list, recv_dt: str) -> dict:
    """Deterministic fallback that produces the full structured output."""
    claim_number = claim.get("claim_number", "")
    days_aged = claim.get("days_aged", 0) or 0
    state = claim.get("state", "OH") or "OH"
    subscriber_id = claim.get("subscriber_id", "") or ""
    specialty = claim.get("provider_specialty", "") or "General Practice"
    par_flag = claim.get("par_flag", "") or "Y"
    hold_code = claim.get("hold_code", "") or ""
    billed_amount = claim.get("billed_amount", 0)

    seed_val = sum(ord(c) for c in claim_number) if claim_number else 42
    filing_limit = STATE_FILING_LIMITS.get(state, 365)
    days_remaining = filing_limit - days_aged

    # Determine max end date from detail lines
    max_end_date = ""
    max_line = "1"
    if detail_lines:
        for line in detail_lines:
            end_dt = str(line.get("end_date", ""))
            if end_dt and end_dt > max_end_date:
                max_end_date = end_dt
                max_line = str(line.get("line_no", 1))
    if not max_end_date:
        max_end_date = recv_dt or datetime.now().strftime("%m/%d/%Y")

    # Calculate DOS to received difference (actual date calculation)
    dos_to_received = days_aged  # fallback
    try:
        # Parse max_end_date and recv_dt to calculate actual difference
        date_formats = ["%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d"]
        dos_date = None
        recv_date = None
        for fmt in date_formats:
            if not dos_date and max_end_date:
                try:
                    dos_date = datetime.strptime(max_end_date, fmt)
                except ValueError:
                    pass
            if not recv_date and recv_dt:
                try:
                    recv_date = datetime.strptime(recv_dt, fmt)
                except ValueError:
                    pass
        if dos_date and recv_date:
            dos_to_received = (recv_date - dos_date).days
    except Exception:
        pass

    # Compliance check
    is_compliant = days_aged <= filing_limit
    compliance_status = "COMPLIANT" if is_compliant else "NON_COMPLIANT"
    filing_status = "WITHIN_TIMELY_FILING_LIMITS" if is_compliant else "EXCEEDED_TIMELY_FILING_LIMITS"

    # COB validation
    primary_insurance = "Medicare"
    primary_term_date = ""
    secondary_insurance = "N/A"
    secondary_term_date = "N/A"
    cob_concern = "NONE"
    cob_issue = "N/A"
    cob_recommendation = "No COB concerns identified"

    if cob_history:
        if len(cob_history) >= 1:
            primary_insurance = cob_history[0].get("primary_insurance", "Medicare")
            primary_term_date = cob_history[0].get("term_date", "")
        if len(cob_history) >= 2:
            secondary_insurance = cob_history[1].get("primary_insurance", "N/A")
            secondary_term_date = cob_history[1].get("term_date", "N/A")
            # Check if secondary coverage terminated before DOS
            if secondary_term_date and max_end_date and secondary_term_date < max_end_date:
                cob_concern = "POTENTIAL_ISSUE"
                cob_issue = f"{secondary_insurance} coverage terminated {secondary_term_date}, but claim contains dates of service after termination"
                cob_recommendation = "Verify COB sequence and coverage validity at time of service"

    # Build line items
    line_items = []
    for line in detail_lines:
        line_items.append({
            "line_number": str(line.get("line_no", 1)),
            "cpt": str(line.get("cpt", "")),
            "modifier": str(line.get("modifier", "0")),
            "start_date": str(line.get("start_date", "")),
            "end_date": str(line.get("end_date", "")),
            "units": line.get("units", 1),
            "billed_amount": float(line.get("billed_amt", 0) or 0),
            "allowed_amount": float(line.get("allowed_amt", 0) or 0),
        })

    # Hold and denial info
    hold_desc = "Authorization pending review" if hold_code else "No hold"
    denial_code = ""
    denial_line = ""
    denial_history = "N"
    if hold_codes:
        hc = hold_codes[0]
        hold_desc = hc.get("description", hold_desc)
        denial_code = hc.get("reason", "")

    # Final recommendation
    if not is_compliant:
        tf_recommendation = "DENY"
        tf_reason = f"Claim aged {days_aged} days exceeds {state} filing limit of {filing_limit} days"
        overall_status = "DENIED_TIMELY_FILING"
        priority = "HIGH"
    elif cob_concern == "POTENTIAL_ISSUE":
        tf_recommendation = "APPROVE"
        tf_reason = "Claim meets deadline requirements"
        overall_status = "PENDING_COB_RESOLUTION"
        priority = "HIGH"
    else:
        tf_recommendation = "APPROVE"
        tf_reason = "Claim meets deadline requirements with substantial margin"
        overall_status = "APPROVED"
        priority = "LOW"

    cob_action_items = []
    if cob_concern == "POTENTIAL_ISSUE":
        cob_action_items = [
            "Verify COB sequence and coverage validity at time of service",
            f"Resolve coverage gap for {secondary_insurance} (terminated {secondary_term_date} vs DOS {max_end_date})",
            f"Confirm {primary_insurance} primary coverage during service dates"
        ]

    return {
        "claim_analysis": {
            "claim_information": {
                "claim_number": claim_number,
                "subscriber_id": subscriber_id,
                "provider_specialty": specialty,
                "par_status": par_flag,
                "received_date": recv_dt or datetime.now().strftime("%m/%d/%Y"),
            },
            "timely_filing_calculation": {
                "date_of_service": {
                    "maximum_end_date": max_end_date,
                    "line_number": max_line,
                },
                "received_date": recv_dt or datetime.now().strftime("%m/%d/%Y"),
                "dos_to_received_difference_days": dos_to_received,
                "dos_to_received_difference_status": compliance_status,
            },
            "timely_filing_status": {
                "days_aged": days_aged,
                "state": state,
                "standard_requirement_days": filing_limit,
                "status": filing_status,
                "compliance": is_compliant,
            },
            "ai_reasoning": {
                "date_difference_status": {
                    "finding": compliance_status,
                    "details": f"The claim was received {dos_to_received} days after the latest date of service ({max_end_date}). This {'falls well within' if is_compliant else 'exceeds'} the standard {filing_limit}-day timely filing requirement for {state}.",
                    "margin_of_safety_days": days_remaining if is_compliant else 0,
                },
                "ky_state_logic": {
                    "applicable": True,
                    "date_difference": dos_to_received,
                    "threshold": filing_limit,
                    "meets_requirement": is_compliant,
                    "finding": f"Claim {'meets' if is_compliant else 'does not meet'} {state}'s timely filing requirements{' with substantial margin for error' if days_remaining > 100 else ''}",
                },
                "cob_validation": {
                    "concern_level": cob_concern,
                    "details": {
                        "primary_insurance": primary_insurance,
                        "primary_term_date": primary_term_date,
                        "secondary_insurance": secondary_insurance,
                        "secondary_term_date": secondary_term_date,
                        "issue_description": cob_issue,
                        "recommendation": cob_recommendation,
                    },
                },
            },
            "claim_details": {
                "line_items": line_items,
            },
            "hold_and_denial_status": {
                "hold_code": hold_code,
                "hold_description": hold_desc,
                "denial_line": denial_line or "1",
                "denial_reason_code": denial_code,
                "denial_history": denial_history,
            },
            "final_recommendation": {
                "timely_filing_recommendation": tf_recommendation,
                "timely_filing_reason": tf_reason,
                "cob_resolution_required": cob_concern == "POTENTIAL_ISSUE",
                "cob_action_items": cob_action_items,
                "overall_status": overall_status,
                "priority": priority,
            },
        }
    }


def _fetch_detail_lines(claim_id: str) -> list:
    """Fetch claim detail lines from DB."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT line_no, cpt, modifier, start_date, end_date, units, billed_amt, allowed_amt
            FROM claim_detail_lines WHERE claim_id = %s ORDER BY line_no
        """, (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return rows
    except Exception:
        return []


def _fetch_cob_history(claim_id: str) -> list:
    """Fetch COB history from DB."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT sno, primary_insurance, effective_date, term_date
            FROM claim_cob_history WHERE claim_id = %s ORDER BY sno
        """, (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return rows
    except Exception:
        return []


def _fetch_hold_codes(claim_id: str) -> list:
    """Fetch hold codes from DB."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT line_no, hold_code, history, reason, description
            FROM claim_hold_codes WHERE claim_id = %s ORDER BY line_no
        """, (claim_id,))
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return rows
    except Exception:
        return []


def _store_header_detail(claim_id: str, header_detail: dict):
    """Store claim header detail record."""
    conn = get_db()
    cur = conn.cursor()
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
