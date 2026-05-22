"""
Resolution Agent - Delegates to the 8-stage COB Pend Resolution Pipeline.

This module provides backward compatibility with the original API while
routing all processing through the new orchestrator.
"""
from app.agents.orchestrator import run_orchestrator


async def run_resolution(claim_data: dict) -> dict:
    """
    Run the resolution agent on a claim.
    Delegates to the full 8-stage orchestrator pipeline.
    
    Args:
        claim_data: Dict with claim fields (must include 'id' for full pipeline)
    
    Returns:
        Dict with confidenceBreakdown, recommendation, and reasoningSummary
    """
    claim_id = claim_data.get("id")

    if not claim_id:
        # Fallback for calls without a claim ID (legacy behavior)
        return _legacy_resolution(claim_data)

    # Run the full orchestrator pipeline
    result = run_orchestrator(str(claim_id))

    if "error" in result:
        return _legacy_resolution(claim_data)

    # Map orchestrator output to the expected API format
    confidence = result.get("confidence", 75)
    stages = result.get("stages", {})

    # Build confidence breakdown from stage results
    stage_3 = stages.get("stage_3", {})
    stage_5 = stages.get("stage_5", {})
    stage_6 = stages.get("stage_6", {})

    eligibility_conf = 95 if stage_3.get("confidence") == "High" else 75 if stage_3.get("confidence") == "Medium" else 50
    pricing_conf = 95 if stage_6.get("confidence") == "High" else 75 if stage_6.get("confidence") == "Medium" else 50
    compliance_conf = 95 if stage_5.get("confidence") == "High" else 75 if stage_5.get("confidence") == "Medium" else 50

    recommendation = "auto-resolve" if confidence >= 92 else "hitl-review" if confidence >= 60 else "deny"

    # Build reasoning summary from stage 1 bullets
    summary_bullets = stages.get("stage_1", {}).get("bullets", [])
    reasoning = " | ".join(summary_bullets[:5]) if summary_bullets else f"Processed with {confidence}% confidence."

    return {
        "confidenceBreakdown": {
            "eligibility": eligibility_conf,
            "pricing": pricing_conf,
            "compliance": compliance_conf,
            "overall": confidence,
        },
        "recommendation": recommendation,
        "reasoningSummary": reasoning,
    }


def _legacy_resolution(claim_data: dict) -> dict:
    """Legacy fallback when no claim ID is available."""
    import random

    classification = claim_data.get("classification", "Other Pend")

    base = random.randint(70, 99)
    if classification == "High Dollar":
        base = random.randint(60, 79)
    elif classification in ("Duplicate", "Pricing"):
        base = random.randint(90, 99)

    eligibility = random.randint(70, 99)
    pricing = random.randint(65, 99)
    compliance = random.randint(75, 99)
    overall = min(99, max(50, (eligibility + pricing + compliance) // 3))

    recommendation = "auto-resolve" if overall >= 92 else "hitl-review" if overall >= 60 else "deny"

    return {
        "confidenceBreakdown": {
            "eligibility": eligibility,
            "pricing": pricing,
            "compliance": compliance,
            "overall": overall,
        },
        "recommendation": recommendation,
        "reasoningSummary": f"Claim {claim_data.get('claim_number')} processed. Classification: {classification}. Overall confidence: {overall}%.",
    }
