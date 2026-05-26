"""Stage 5: Coordination of Benefits Rule Agent.

Reads EOB extraction data and claim detail lines.
Applies PR code logic to determine primary/secondary/deny status.
"""
import json
import random
from app.agents.base_agent import call_bedrock, store_stage_output, parse_bedrock_json
from app.db.pool import get_db

STAGE_NUMBER = 5
STAGE_NAME = "Coordination Rule Application"
AGENT_NAME = "Coordination Agent"

# PR code classification rules
# PR 96/204 = Pay as Primary (other carrier denied/non-covered)
# PR 1/2/3 = Pay as Secondary (patient responsibility from primary)
# CO 45 = Deny (contractual obligation - exceeds fee schedule)
PRIMARY_PR_CODES = ["PR-96", "PR-204"]
SECONDARY_PR_CODES = ["PR-1", "PR-2", "PR-3"]
DENY_CODES = ["CO-45", "CO-97", "CO-253"]


def run_coordination_agent(claim: dict) -> dict:
    """Run coordination rule application for a claim."""
    claim_id = claim["id"]
    claim_number = claim.get("claim_number", "")
    billed_amount = float(claim.get("billed_amount", 0) or 0)

    # Fetch EOB extraction data from DB (stored by eligibility agent)
    eob_data = _fetch_eob_data(claim_id)

    # Fetch or generate claim detail lines
    detail_lines = _fetch_or_generate_detail_lines(claim)

    # Try Bedrock for enhanced reasoning
    prompt_used = _build_prompt(claim, eob_data, detail_lines)
    bedrock_result = _try_bedrock_with_prompt(prompt_used)

    if bedrock_result:
        outcome = bedrock_result.get("outcome", "Pay as Primary")
        reasoning = bedrock_result.get("reasoning", "")
        confidence = bedrock_result.get("confidence", "High")
        coordination_type = bedrock_result.get("coordination_type", "Primary")
        pr_code_analysis = bedrock_result.get("pr_code_analysis", {})
    else:
        # Deterministic fallback
        outcome, reasoning, confidence, coordination_type, pr_code_analysis = _deterministic_logic(
            claim, eob_data, detail_lines
        )

    # Build output
    output_data = {
        "outcome": outcome,
        "confidence": confidence,
        "reasoning": reasoning,
        "coordination_type": coordination_type,
        "pr_code_analysis": pr_code_analysis,
        "eob_records_analyzed": len(eob_data),
        "detail_lines_count": len(detail_lines),
        "primary_pr_codes_found": pr_code_analysis.get("primary_codes", []),
        "secondary_pr_codes_found": pr_code_analysis.get("secondary_codes", []),
        "deny_codes_found": pr_code_analysis.get("deny_codes", []),
    }

    # Store stage output
    store_stage_output(
        claim_id, STAGE_NUMBER, STAGE_NAME, AGENT_NAME,
        {"claim_number": claim_number, "eob_count": len(eob_data), "detail_lines": len(detail_lines)},
        output_data, outcome, confidence, reasoning,
        prompt_text=prompt_used
    )

    return output_data


def _fetch_eob_data(claim_id: str) -> list:
    """Fetch EOB extraction data from the database."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT sno, cpt, insurance_name, paid_amt, adj_grp_code, reason_code, pr_amount, image_ref
        FROM claim_eob_extraction WHERE claim_id = %s ORDER BY sno
    """, (claim_id,))
    cols = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(zip(cols, row)) for row in rows]


def _fetch_or_generate_detail_lines(claim: dict) -> list:
    """Fetch existing detail lines or generate them."""
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
        # Generate and store detail lines
        return _generate_detail_lines(claim)


def _fetch_detail_lines(claim_id: str) -> list:
    """Fetch claim detail lines from the database."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT line_no, cpt, modifier, start_date, end_date, units, billed_amt, allowed_amt, copay, coinsurance, oc_paid
        FROM claim_detail_lines WHERE claim_id = %s ORDER BY line_no
    """, (claim_id,))
    cols = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(zip(cols, row)) for row in rows]


def _generate_detail_lines(claim: dict) -> list:
    """Generate realistic claim detail lines based on claim data."""
    claim_id = claim["id"]
    claim_number = claim.get("claim_number", "")
    billed_amount = float(claim.get("billed_amount", 0) or 0)

    seed_val = sum(ord(c) for c in claim_number) if claim_number else 42
    rng = random.Random(seed_val)

    # Determine number of lines (1-4 based on billed amount)
    if billed_amount > 20000:
        num_lines = 4
    elif billed_amount > 10000:
        num_lines = 3
    elif billed_amount > 3000:
        num_lines = 2
    else:
        num_lines = 1

    cpt_codes = ["99213", "99214", "99215", "99203", "71046", "73721", "27447", "43239", "29881"]
    modifiers = ["", "", "", "26", "TC", "59", ""]  # Most lines have no modifier

    # Distribute billed amount across lines
    lines = []
    remaining = billed_amount
    recv_dt = claim.get("recv_dt", "01/15/2025") or "01/15/2025"

    for i in range(num_lines):
        if i == num_lines - 1:
            line_billed = remaining
        else:
            line_billed = round(remaining * rng.uniform(0.3, 0.6), 2)
            remaining -= line_billed

        allowed_pct = rng.uniform(0.70, 0.95)
        allowed_amt = round(line_billed * allowed_pct, 2)
        oc_paid_pct = rng.uniform(0.50, 0.85)
        oc_paid = round(allowed_amt * oc_paid_pct, 2)
        copay = round(rng.uniform(20, 50), 2) if i == 0 else 0
        coinsurance = round((allowed_amt - oc_paid - copay) * rng.uniform(0.1, 0.3), 2)
        coinsurance = max(0, coinsurance)

        line = {
            "line_no": i + 1,
            "cpt": cpt_codes[seed_val % len(cpt_codes)],
            "modifier": modifiers[(seed_val + i) % len(modifiers)],
            "start_date": recv_dt,
            "end_date": recv_dt,
            "units": 1,
            "billed_amt": line_billed,
            "allowed_amt": allowed_amt,
            "copay": copay,
            "coinsurance": coinsurance,
            "oc_paid": oc_paid,
        }
        lines.append(line)
        seed_val += 7  # Shift seed for variety

    # Store in database
    _store_detail_lines(claim_id, lines)
    return lines


def _store_detail_lines(claim_id: str, lines: list):
    """Store claim detail lines in the database."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM claim_detail_lines WHERE claim_id = %s", (claim_id,))

    for line in lines:
        cur.execute("""
            INSERT INTO claim_detail_lines (claim_id, line_no, cpt, modifier, start_date, end_date, units, billed_amt, allowed_amt, copay, coinsurance, oc_paid)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            claim_id,
            line.get("line_no", 1),
            line.get("cpt", ""),
            line.get("modifier", ""),
            line.get("start_date", ""),
            line.get("end_date", ""),
            line.get("units", 1),
            line.get("billed_amt", 0),
            line.get("allowed_amt", 0),
            line.get("copay", 0),
            line.get("coinsurance", 0),
            line.get("oc_paid", 0),
        ))

    conn.commit()
    cur.close()
    conn.close()


def _build_prompt(claim: dict, eob_data: list, detail_lines: list) -> str:
    """Build the prompt for coordination analysis."""
    return f"""You are a healthcare COB coordination rule analyst.
Analyze the coordination of benefits for:
Claim: {claim.get('claim_number')}
Billed: ${claim.get('billed_amount', 0)}

EOB Data: {json.dumps(eob_data, default=str)}
Detail Lines: {json.dumps(detail_lines, default=str)}

Apply PR code rules:
- PR-96 or PR-204 = Pay as Primary (other carrier denied as non-covered)
- PR-1, PR-2, PR-3 = Pay as Secondary (patient responsibility from primary)
- CO-45 = Deny (contractual obligation)

Determine outcome:
- "Pay as Primary" if PR-96/204 codes found
- "Pay as Secondary" if PR-1/2/3 codes found
- "DNNPR" if CO-45 or no valid PR codes

Return JSON:
{{
  "outcome": "...",
  "coordination_type": "Primary" or "Secondary" or "Deny",
  "pr_code_analysis": {{
    "primary_codes": [...],
    "secondary_codes": [...],
    "deny_codes": [...]
  }},
  "reasoning": "...",
  "confidence": "High" or "Medium" or "Low"
}}"""


def _try_bedrock_with_prompt(prompt: str) -> dict:
    """Try to use Bedrock with the given prompt."""
    if not prompt:
        return None
    response = call_bedrock(prompt, max_tokens=1500)
    return parse_bedrock_json(response)


def _try_bedrock(claim: dict, eob_data: list, detail_lines: list) -> dict:
    """Try to use Bedrock for coordination analysis (legacy wrapper)."""
    prompt = _build_prompt(claim, eob_data, detail_lines)
    return _try_bedrock_with_prompt(prompt)


def _deterministic_logic(claim: dict, eob_data: list, detail_lines: list) -> tuple:
    """Deterministic fallback for coordination rule application."""
    # Analyze PR codes from EOB data
    primary_codes_found = []
    secondary_codes_found = []
    deny_codes_found = []

    for eob in eob_data:
        reason_code = eob.get("reason_code", "")
        if reason_code in PRIMARY_PR_CODES:
            primary_codes_found.append(reason_code)
        elif reason_code in SECONDARY_PR_CODES:
            secondary_codes_found.append(reason_code)
        elif reason_code in DENY_CODES:
            deny_codes_found.append(reason_code)

    pr_code_analysis = {
        "primary_codes": primary_codes_found,
        "secondary_codes": secondary_codes_found,
        "deny_codes": deny_codes_found,
    }

    # Determine outcome based on PR code hierarchy
    if deny_codes_found:
        outcome = "DNNPR"
        coordination_type = "Deny"
        confidence = "High"
        reasoning = (
            f"Contractual obligation code(s) {', '.join(deny_codes_found)} found in EOB. "
            f"Charge exceeds fee schedule. Denial DNNPR recommended."
        )
    elif primary_codes_found:
        outcome = "Pay as Primary"
        coordination_type = "Primary"
        confidence = "High"
        reasoning = (
            f"PR code(s) {', '.join(primary_codes_found)} indicate other carrier denied as non-covered. "
            f"This plan should pay as primary payer for {len(detail_lines)} service line(s)."
        )
    elif secondary_codes_found:
        outcome = "Pay as Secondary"
        coordination_type = "Secondary"
        confidence = "High"
        reasoning = (
            f"PR code(s) {', '.join(secondary_codes_found)} indicate patient responsibility from primary carrier. "
            f"This plan should pay as secondary payer, covering remaining patient responsibility."
        )
    else:
        # No clear PR codes - default to secondary based on COB classification
        outcome = "Pay as Secondary"
        coordination_type = "Secondary"
        confidence = "Medium"
        reasoning = (
            f"No definitive PR codes found in EOB data. Based on COB classification "
            f"({claim.get('classification', 'N/A')}), defaulting to secondary payer determination."
        )

    return outcome, reasoning, confidence, coordination_type, pr_code_analysis
