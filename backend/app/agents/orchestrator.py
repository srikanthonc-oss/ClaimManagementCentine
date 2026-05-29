"""Resolution Orchestrator — runs agents for a claim with conditional posting.

Flow:
1. Stages 2-6 run (analysis pipeline)
2. Confidence score calculated from stages 2-6
3. If confidence >= threshold: auto-approve → run stages 7 & 8 immediately
4. If confidence < threshold: set to InReview → stages 7 & 8 wait for examiner decision
5. After examiner decides (approve/deny): run_posting_pipeline() executes stages 7 & 8
"""
from app.agents.base_agent import store_stage_output
from app.agents.hold_code_agent import run_hold_code_agent
from app.agents.eligibility_agent import run_eligibility_agent
from app.agents.timely_filing_agent import run_timely_filing_agent
from app.agents.coordination_agent import run_coordination_agent
from app.agents.cob_calculation_agent import run_cob_calculation_agent
from app.agents.posting_agent import run_posting_agent
from app.db.pool import get_db
import json


def run_orchestrator(claim_id: str) -> dict:
    """Run analysis agents (stages 2-6) for a claim. Stages 7-8 run conditionally."""
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

    # Immediately set status to "Processing" so UI reflects in-progress state
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE claims SET status = 'Processing', updated_at = NOW() WHERE id = %s", (claim["id"],))
    conn.commit()
    cur.close()
    conn.close()

    results = {}

    # Stage 2, 3, 4 can run in parallel (no dependencies between them)
    import concurrent.futures
    print(f"[Orchestrator] Running Stages 2, 3, 4 in parallel for {claim['claim_number']}")

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        future_2 = executor.submit(run_hold_code_agent, claim)
        future_3 = executor.submit(run_eligibility_agent, claim)
        future_4 = executor.submit(run_timely_filing_agent, claim)

        results["stage_2"] = future_2.result()
        results["stage_3"] = future_3.result()
        results["stage_4"] = future_4.result()

    # Stage 5: Coordination Rule (depends on Stage 3 EOB data)
    print(f"[Orchestrator] Running Stage 5: Coordination Rule for {claim['claim_number']}")
    results["stage_5"] = run_coordination_agent(claim)

    # Stage 6: COB Calculation (depends on Stage 3 + 5 data)
    print(f"[Orchestrator] Running Stage 6: COB Calculation for {claim['claim_number']}")
    results["stage_6"] = run_cob_calculation_agent(claim)

    # Calculate confidence from stages 2-6
    overall_confidence = _calculate_confidence(claim, results)

    # Read threshold from DB
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT auto_resolve FROM routing_thresholds WHERE id = 'global'")
    threshold_row = cur.fetchone()
    auto_resolve_threshold = threshold_row[0] if threshold_row else 92
    cur.close()
    conn.close()

    # Stage 7: Posting Recommendation — always runs (uses all prior stage data)
    print(f"[Orchestrator] Running Stage 7: Posting Recommendation for {claim['claim_number']}")
    results["stage_7"] = run_posting_agent(claim, results)

    # Determine status based on confidence vs threshold
    if overall_confidence >= auto_resolve_threshold:
        new_status = "Approved"
        print(f"[Orchestrator] Auto-approve ({overall_confidence}% >= {auto_resolve_threshold}%)")
    else:
        new_status = "InReview"
        print(f"[Orchestrator] HITL Required ({overall_confidence}% < {auto_resolve_threshold}%) — Examiner review needed")

    # Stage 1: AI Summary
    summary = generate_ai_summary(claim, results, overall_confidence, auto_resolve_threshold)
    results["stage_1"] = summary
    store_stage_output(claim["id"], 1, "AI Extracted Data Summary", "Resolution Orchestrator",
                       {"claim_number": claim["claim_number"]}, summary, "Summarized", "High", summary.get("reasoning", ""))

    # Update claim confidence and status
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE claims SET confidence = %s, status = %s, updated_at = NOW() WHERE id = %s",
                (overall_confidence, new_status, claim["id"]))

    # Store combined result in agent_results
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


def run_posting_pipeline(claim_id: str, examiner_decision: str = "approve") -> dict:
    """Run stages 7 & 8 after examiner decision. Called when examiner approves/denies a claim.
    
    Args:
        claim_id: The claim UUID
        examiner_decision: "approve", "deny", or "pend-back"
    
    Returns:
        Dict with posting and validation results
    """
    # Fetch claim
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
    for key, val in claim.items():
        if hasattr(val, "as_integer_ratio"):
            claim[key] = float(val)

    # Fetch prior stage results from agent_stage_outputs
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT stage_number, output_data, outcome, confidence
        FROM agent_stage_outputs WHERE claim_id = %s AND stage_number BETWEEN 2 AND 6
        ORDER BY stage_number
    """, (claim_id,))
    prior_results = {}
    for stage_row in cur.fetchall():
        stage_num = stage_row[0]
        output = stage_row[1] if isinstance(stage_row[1], dict) else json.loads(stage_row[1]) if stage_row[1] else {}
        prior_results[f"stage_{stage_num}"] = output
        prior_results[f"stage_{stage_num}"]["outcome"] = stage_row[2]
        prior_results[f"stage_{stage_num}"]["confidence"] = stage_row[3]
    cur.close()
    conn.close()

    # Add examiner decision context to the results
    prior_results["examiner_decision"] = examiner_decision

    print(f"[Orchestrator] Running Posting Pipeline for {claim['claim_number']} — Decision: {examiner_decision}")

    # Stage 7: Posting (with examiner decision)
    stage_7_result = run_posting_agent(claim, prior_results)

    # Update agent_results with the new stage
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT result_data FROM agent_results WHERE claim_id = %s", (claim_id,))
    ar_row = cur.fetchone()
    if ar_row:
        existing = json.loads(ar_row[0]) if isinstance(ar_row[0], str) else ar_row[0]
        existing["stage_7"] = stage_7_result
        cur.execute("UPDATE agent_results SET result_data = %s, processed_at = NOW() WHERE claim_id = %s",
                    (json.dumps(existing, default=str), claim_id))
    conn.commit()
    cur.close()
    conn.close()

    print(f"[Orchestrator] Posting Pipeline Complete for {claim['claim_number']}")

    return {"stage_7": stage_7_result}


def _calculate_confidence(claim: dict, results: dict) -> int:
    """Calculate overall confidence from stages 2-6 results."""
    confidences = []
    for key, val in results.items():
        if isinstance(val, dict):
            conf = val.get("confidence", "Medium")
            outcome = str(val.get("outcome", ""))

            if conf == "High":
                base = 95
            elif conf == "Medium":
                base = 75
            else:
                base = 50

            if "Denied" in outcome or "DNNPR" in outcome or "DN0" in outcome or "DENY" in outcome.upper():
                base = min(base, 60)
            elif "Human Review" in outcome or "Exception" in outcome or "HOLD" in outcome.upper():
                base = min(base, 70)
            elif "Already Processed" in outcome or "Duplicate" in outcome:
                base = min(base, 65)

            confidences.append(base)

    overall = round(sum(confidences) / len(confidences)) if confidences else 0

    # Adjustments based on claim characteristics
    days_aged = claim.get("days_aged", 0) or 0
    billed = float(claim.get("billed_amount", 0) or 0)
    hold_code = claim.get("hold_code", "") or ""

    if billed > 50000:
        overall = min(overall, 80)
    elif billed > 20000:
        overall = max(overall - 5, 60)

    if days_aged > 300:
        overall = max(overall - 8, 55)
    elif days_aged > 200:
        overall = max(overall - 3, 65)

    if hold_code and not any(c in hold_code for c in ["COB", "cob"]):
        overall = max(overall - 5, 60)

    return max(50, min(99, overall))


def generate_ai_summary(claim: dict, results: dict, confidence: int, threshold: int = 92) -> dict:
    """Generate the AI summary bullets from all stage results."""
    net_amount = 0
    # Try to get net from new COB calc format
    stage_6 = results.get("stage_6", {})
    if isinstance(stage_6, dict):
        claim_analysis = stage_6.get("claim_analysis", {})
        if claim_analysis:
            totals = claim_analysis.get("claim_totals", {})
            net_amount = float(totals.get("total_oc_paid", 0) or 0)
        else:
            net_amount = float(stage_6.get("net_amount", 0) or 0)

    # Get stage outcomes (handle both new and old formats)
    stage_2_outcome = results.get("stage_2", {}).get("outcome", "N/A")
    stage_3_outcome = results.get("stage_3", {}).get("outcome", "N/A")
    stage_4_outcome = results.get("stage_4", {}).get("outcome", "N/A")
    stage_5_outcome = results.get("stage_5", {}).get("outcome", "N/A")
    stage_7_outcome = results.get("stage_7", {}).get("outcome", "N/A")

    bullets = [
        f"Claim {claim['claim_number']} classified as {claim.get('classification', 'N/A')} on {claim.get('platform', 'N/A')}",
        f"Hold code: {claim.get('hold_code', 'N/A')} — {stage_2_outcome}",
        f"Eligibility: {stage_3_outcome}",
        f"Timely filing: {stage_4_outcome} ({claim.get('days_aged', 0)} days aged)",
        f"Coordination: {stage_5_outcome}",
        f"COB Calculation: Total OC Paid ${net_amount:.2f}",
        f"Posting: {stage_7_outcome}",
        f"Overall confidence: {confidence}% — {'Auto-resolve' if confidence >= threshold else 'HITL Required'}",
    ]
    return {"bullets": bullets, "confidence": "High", "outcome": "Summarized", "reasoning": "; ".join(bullets[:3])}
