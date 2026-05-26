"""Stage 6: COB Calculation Agent.

Reads claim_detail_lines and applies the 3-condition COB formula:
1. If OC Paid > Total PR: Non-Covered = (OC Paid - Allowed) - PR Amount
2. If OC Paid < Total PR: Non-Covered = 0, Net = 0
3. If OC Paid = 0: Non-Covered = 0, Allowed = PR Amount
"""
import json
from decimal import Decimal, ROUND_HALF_UP
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

    # Fetch detail lines from DB
    detail_lines = _fetch_detail_lines(claim_id)

    # Fetch EOB data for PR amounts
    eob_data = _fetch_eob_data(claim_id)

    # Calculate total PR from EOB
    total_pr = sum(float(e.get("pr_amount", 0) or 0) for e in eob_data)

    # Try Bedrock for enhanced calculation reasoning
    prompt_used = _build_prompt(claim, detail_lines, eob_data, total_pr)
    bedrock_result = _try_bedrock_with_prompt(prompt_used)

    if bedrock_result:
        line_calculations = bedrock_result.get("line_calculations", [])
        net_amount = bedrock_result.get("net_amount", 0)
        non_covered = bedrock_result.get("non_covered", 0)
        condition_applied = bedrock_result.get("condition_applied", "")
        outcome = bedrock_result.get("outcome", "Calculated")
        reasoning = bedrock_result.get("reasoning", "")
        confidence = bedrock_result.get("confidence", "High")
    else:
        # Deterministic calculation
        line_calculations, net_amount, non_covered, condition_applied, outcome, reasoning, confidence = (
            _deterministic_calculation(claim, detail_lines, eob_data, total_pr)
        )

    # Build output
    output_data = {
        "outcome": outcome,
        "confidence": confidence,
        "reasoning": reasoning,
        "net_amount": net_amount,
        "non_covered": non_covered,
        "total_billed": billed_amount,
        "total_allowed": sum(float(l.get("allowed_amt", 0) or 0) for l in detail_lines),
        "total_oc_paid": sum(float(l.get("oc_paid", 0) or 0) for l in detail_lines),
        "total_pr": total_pr,
        "condition_applied": condition_applied,
        "line_calculations": line_calculations,
        "lines_processed": len(detail_lines),
    }

    # Store stage output
    store_stage_output(
        claim_id, STAGE_NUMBER, STAGE_NAME, AGENT_NAME,
        {"claim_number": claim_number, "billed_amount": billed_amount, "total_pr": total_pr},
        output_data, outcome, confidence, reasoning,
        prompt_text=prompt_used
    )

    return output_data


def _fetch_detail_lines(claim_id: str) -> list:
    """Fetch claim detail lines from the database."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT line_no, cpt, modifier, units, billed_amt, allowed_amt, copay, coinsurance, oc_paid
        FROM claim_detail_lines WHERE claim_id = %s ORDER BY line_no
    """, (claim_id,))
    cols = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(zip(cols, row)) for row in rows]


def _fetch_eob_data(claim_id: str) -> list:
    """Fetch EOB extraction data from the database."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT sno, cpt, insurance_name, paid_amt, adj_grp_code, reason_code, pr_amount
        FROM claim_eob_extraction WHERE claim_id = %s ORDER BY sno
    """, (claim_id,))
    cols = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(zip(cols, row)) for row in rows]


def _build_prompt(claim: dict, detail_lines: list, eob_data: list, total_pr: float) -> str:
    """Build the prompt for COB calculation reasoning."""
    return f"""You are a healthcare COB calculation specialist.
Apply the 3-condition COB formula for claim {claim.get('claim_number')}:

Detail Lines: {json.dumps(detail_lines, default=str)}
EOB Data: {json.dumps(eob_data, default=str)}
Total PR Amount: ${total_pr:.2f}

COB Formula (apply per line):
Condition 1: If OC Paid > Total PR → Non-Covered = (OC Paid - Allowed) adjusted by PR; Net = Allowed - Non-Covered - OC Paid
Condition 2: If OC Paid < Total PR → Non-Covered = 0; Net = 0 (primary paid less than PR)
Condition 3: If OC Paid = 0 → Non-Covered = 0; Allowed = PR Amount; Net = PR Amount

For each line calculate: allowed_amt, oc_paid, pr_share, non_covered, net_payable

Return JSON:
{{
  "line_calculations": [{{
    "line_no": 1,
    "billed": ...,
    "allowed": ...,
    "oc_paid": ...,
    "pr_share": ...,
    "non_covered": ...,
    "net_payable": ...
  }}],
  "net_amount": <total net payable>,
  "non_covered": <total non-covered>,
  "condition_applied": "Condition 1" or "Condition 2" or "Condition 3",
  "outcome": "Calculated",
  "reasoning": "...",
  "confidence": "High"
}}"""


def _try_bedrock_with_prompt(prompt: str) -> dict:
    """Try to use Bedrock with the given prompt."""
    if not prompt:
        return None
    response = call_bedrock(prompt, max_tokens=2000)
    return parse_bedrock_json(response)


def _try_bedrock(claim: dict, detail_lines: list, eob_data: list, total_pr: float) -> dict:
    """Try to use Bedrock for COB calculation reasoning (legacy wrapper)."""
    prompt = _build_prompt(claim, detail_lines, eob_data, total_pr)
    return _try_bedrock_with_prompt(prompt)


def _deterministic_calculation(claim: dict, detail_lines: list, eob_data: list, total_pr: float) -> tuple:
    """Deterministic COB calculation using the 3-condition formula."""
    line_calculations = []
    total_net = 0.0
    total_non_covered = 0.0
    condition_applied = ""

    # Distribute PR across lines proportionally
    total_allowed = sum(float(l.get("allowed_amt", 0) or 0) for l in detail_lines)
    total_oc_paid = sum(float(l.get("oc_paid", 0) or 0) for l in detail_lines)

    for line in detail_lines:
        billed = float(line.get("billed_amt", 0) or 0)
        allowed = float(line.get("allowed_amt", 0) or 0)
        oc_paid = float(line.get("oc_paid", 0) or 0)

        # Calculate PR share for this line (proportional to allowed amount)
        if total_allowed > 0:
            pr_share = total_pr * (allowed / total_allowed)
        else:
            pr_share = total_pr / max(len(detail_lines), 1)

        # Apply 3-condition COB formula
        if oc_paid > pr_share and oc_paid > 0:
            # Condition 1: OC Paid > Total PR
            # Non-Covered = max(0, (OC Paid - Allowed))
            # Net = max(0, Allowed - OC Paid)
            non_covered = max(0, oc_paid - allowed)
            net_payable = max(0, allowed - oc_paid)
            if not condition_applied:
                condition_applied = "Condition 1: OC Paid > PR"
        elif oc_paid < pr_share and oc_paid > 0:
            # Condition 2: OC Paid < Total PR
            # Non-Covered = 0, Net = PR - OC Paid (we pay the difference)
            non_covered = 0
            net_payable = max(0, pr_share - oc_paid)
            if not condition_applied:
                condition_applied = "Condition 2: OC Paid < PR"
        elif oc_paid == 0:
            # Condition 3: OC Paid = 0
            # Non-Covered = 0, Allowed = PR Amount, Net = PR Amount
            non_covered = 0
            net_payable = pr_share
            allowed = pr_share  # Override allowed
            if not condition_applied:
                condition_applied = "Condition 3: OC Paid = 0"
        else:
            # Edge case: OC Paid equals PR exactly
            non_covered = 0
            net_payable = 0
            if not condition_applied:
                condition_applied = "Condition 1: OC Paid = PR (balanced)"

        # Round to 2 decimal places
        non_covered = round(non_covered, 2)
        net_payable = round(net_payable, 2)
        pr_share = round(pr_share, 2)

        line_calculations.append({
            "line_no": line.get("line_no", 1),
            "billed": billed,
            "allowed": allowed,
            "oc_paid": oc_paid,
            "pr_share": pr_share,
            "non_covered": non_covered,
            "net_payable": net_payable,
        })

        total_net += net_payable
        total_non_covered += non_covered

    total_net = round(total_net, 2)
    total_non_covered = round(total_non_covered, 2)

    # Determine outcome
    if total_net > 0:
        outcome = "Calculated"
        confidence = "High"
        reasoning = (
            f"COB calculation complete. {condition_applied}. "
            f"Total allowed: ${total_allowed:.2f}, OC paid: ${total_oc_paid:.2f}, "
            f"PR amount: ${total_pr:.2f}. Net payable: ${total_net:.2f}, Non-covered: ${total_non_covered:.2f}."
        )
    elif total_net == 0 and total_oc_paid > 0:
        outcome = "Calculated - Zero Net"
        confidence = "High"
        reasoning = (
            f"COB calculation shows zero net payable. {condition_applied}. "
            f"Other carrier payment of ${total_oc_paid:.2f} satisfies or exceeds PR amount of ${total_pr:.2f}."
        )
    else:
        outcome = "Calculated"
        confidence = "Medium"
        reasoning = (
            f"COB calculation complete with limited data. {condition_applied}. "
            f"Net payable: ${total_net:.2f}."
        )

    return line_calculations, total_net, total_non_covered, condition_applied, outcome, reasoning, confidence
