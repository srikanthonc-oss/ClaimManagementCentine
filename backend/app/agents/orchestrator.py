"""Resolution Orchestrator — runs all 8 agents in sequence for a claim."""
from app.agents.base_agent import store_stage_output
from app.agents.hold_code_agent import run_hold_code_agent
from app.agents.eligibility_agent import run_eligibility_agent
from app.agents.timely_filing_agent import run_timely_filing_agent
from app.agents.coordination_agent import run_coordination_agent
from app.agents.cob_calculation_agent import run_cob_calculation_agent
from app.agents.posting_agent import run_posting_agent
from app.agents.post_validation_agent import run_post_validation_agent
from app.db.pool import get_db
import json


def run_orchestrator(claim_id: str) -> dict:
    """Run all agents for a claim and return the combined result."""
    # Fetch claim data
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM claims WHERE id = %s", (claim_id,))
    cols = [desc[0] for desc in cur.description]
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return {"error": "Claim not found"}

    claim = dict(zip(cols, row))
    claim["id"] = str(claim["id"])

    # Convert Decimal types to float for JSON serialization
    for key, val in claim.items():
        if hasattr(val, "as_integer_ratio"):  # Decimal/float duck typing
            claim[key] = float(val)

    results = {}

    # Stage 1: AI Summary (generated from all other stages at the end)

    # Stage 2: Hold Code Validation
    print(f"[Orchestrator] Running Stage 2: Hold Code Validation for {claim['claim_number']}")
    results["stage_2"] = run_hold_code_agent(claim)

    # Stage 3: Member Eligibility
    print(f"[Orchestrator] Running Stage 3: Member Eligibility for {claim['claim_number']}")
    results["stage_3"] = run_eligibility_agent(claim)

    # Stage 4: Timely Filing
    print(f"[Orchestrator] Running Stage 4: Timely Filing for {claim['claim_number']}")
    results["stage_4"] = run_timely_filing_agent(claim)

    # Stage 5: Coordination Rule
    print(f"[Orchestrator] Running Stage 5: Coordination Rule for {claim['claim_number']}")
    results["stage_5"] = run_coordination_agent(claim)

    # Stage 6: COB Calculation
    print(f"[Orchestrator] Running Stage 6: COB Calculation for {claim['claim_number']}")
    results["stage_6"] = run_cob_calculation_agent(claim)

    # Stage 7: Posting
    print(f"[Orchestrator] Running Stage 7: Posting for {claim['claim_number']}")
    results["stage_7"] = run_posting_agent(claim, results)

    # Stage 8: Post Validation
    print(f"[Orchestrator] Running Stage 8: Post Validation for {claim['claim_number']}")
    results["stage_8"] = run_post_validation_agent(claim, results)

    # Calculate overall confidence
    confidences = []
    for key, val in results.items():
        if isinstance(val, dict):
            conf = val.get("confidence", "Medium")
            if conf == "High":
                confidences.append(95)
            elif conf == "Medium":
                confidences.append(75)
            else:
                confidences.append(50)
    overall_confidence = round(sum(confidences) / len(confidences)) if confidences else 0

    # Read threshold from DB for status determination
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT auto_resolve FROM routing_thresholds WHERE id = 'global'")
    threshold_row = cur.fetchone()
    auto_resolve_threshold = threshold_row[0] if threshold_row else 92
    cur.close()
    conn.close()

    # Stage 1: AI Summary
    summary = generate_ai_summary(claim, results, overall_confidence, auto_resolve_threshold)
    results["stage_1"] = summary
    store_stage_output(claim["id"], 1, "AI Extracted Data Summary", "Resolution Orchestrator",
                       {"claim_number": claim["claim_number"]}, summary, "Summarized", "High", summary.get("reasoning", ""))

    # Update claim confidence and status
    conn = get_db()
    cur = conn.cursor()

    new_status = "Approved" if overall_confidence >= auto_resolve_threshold else "InReview"
    cur.execute("UPDATE claims SET confidence = %s, status = %s, updated_at = NOW() WHERE id = %s",
                (overall_confidence, new_status, claim["id"]))

    # Store combined result in agent_results
    # Serialize results safely (handle Decimal types)
    results_json = json.dumps(results, default=str)
    confidence_json = json.dumps({"overall": overall_confidence})

    cur.execute("""
        INSERT INTO agent_results (claim_id, claim_number, result_data, confidence, recommendation, reasoning_summary)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (claim_id) DO UPDATE SET
            result_data = %s, confidence = %s, recommendation = %s, reasoning_summary = %s, processed_at = NOW()
    """, (claim["id"], claim["claim_number"], results_json, confidence_json,
          new_status, summary.get("reasoning", ""),
          results_json, confidence_json, new_status, summary.get("reasoning", "")))

    conn.commit()
    cur.close()
    conn.close()

    print(f"[Orchestrator] Complete: {claim['claim_number']} — Confidence: {overall_confidence}%, Status: {new_status}")

    return {"claim_id": claim["id"], "confidence": overall_confidence, "status": new_status, "stages": results}


def generate_ai_summary(claim: dict, results: dict, confidence: int, threshold: int = 92) -> dict:
    """Generate the AI summary bullets from all stage results."""
    net_amount = results.get("stage_6", {}).get("net_amount", 0) or 0
    try:
        net_amount = float(net_amount)
    except (TypeError, ValueError):
        net_amount = 0.0

    bullets = [
        f"Claim {claim['claim_number']} classified as {claim.get('classification', 'N/A')} on {claim.get('platform', 'N/A')}",
        f"Hold code: {claim.get('hold_code', 'N/A')} — {results.get('stage_2', {}).get('outcome', 'N/A')}",
        f"Primary insurance: {results.get('stage_3', {}).get('primary_insurance', 'N/A')}",
        f"Eligibility: {results.get('stage_3', {}).get('outcome', 'N/A')}",
        f"Timely filing: {results.get('stage_4', {}).get('outcome', 'N/A')} ({claim.get('days_aged', 0)} days aged)",
        f"Coordination: {results.get('stage_5', {}).get('outcome', 'N/A')}",
        f"Net payable: ${net_amount:.2f}",
        f"Posting: {results.get('stage_7', {}).get('outcome', 'N/A')}",
        f"Validation: {results.get('stage_8', {}).get('outcome', 'N/A')}",
        f"Overall confidence: {confidence}% — {'Auto-resolve' if confidence >= threshold else 'HITL Required'}",
    ]
    return {"bullets": bullets, "confidence": "High", "outcome": "Summarized", "reasoning": "; ".join(bullets[:3])}
