"""Stage 8: Post Validation Agent.

Validates all prior stage outputs, checks for inconsistencies,
and provides final claim disposition recommendation.
"""
import json
from app.agents.base_agent import call_bedrock, store_stage_output, parse_bedrock_json
from app.db.pool import get_db

STAGE_NUMBER = 8
STAGE_NAME = "Post Validation & QA"
AGENT_NAME = "Post Validation Agent"


def run_post_validation_agent(claim: dict, prior_results: dict) -> dict:
    """Run post-validation checks on all prior stage results."""
    claim_id = claim["id"]
    claim_number = claim.get("claim_number", "")
    billed_amount = float(claim.get("billed_amount", 0) or 0)

    # Try Bedrock for enhanced validation
    bedrock_result = _try_bedrock(claim, prior_results)

    if bedrock_result:
        outcome = bedrock_result.get("outcome", "Claim Ready for Finalization")
        reasoning = bedrock_result.get("reasoning", "")
        confidence = bedrock_result.get("confidence", "High")
        validation_checks = bedrock_result.get("validation_checks", [])
        issues_found = bedrock_result.get("issues_found", [])
    else:
        # Deterministic fallback
        outcome, reasoning, confidence, validation_checks, issues_found = _deterministic_validation(
            claim, prior_results
        )

    # Build output
    output_data = {
        "outcome": outcome,
        "confidence": confidence,
        "reasoning": reasoning,
        "validation_checks": validation_checks,
        "issues_found": issues_found,
        "total_checks": len(validation_checks),
        "checks_passed": sum(1 for v in validation_checks if v.get("passed", False)),
        "checks_failed": sum(1 for v in validation_checks if not v.get("passed", True)),
        "final_disposition": _determine_final_disposition(prior_results, issues_found),
    }

    # Store stage output
    store_stage_output(
        claim_id, STAGE_NUMBER, STAGE_NAME, AGENT_NAME,
        {"claim_number": claim_number, "stages_completed": len(prior_results)},
        output_data, outcome, confidence, reasoning
    )

    return output_data


def _try_bedrock(claim: dict, prior_results: dict) -> dict:
    """Try to use Bedrock for post-validation analysis."""
    # Build summary of all stages
    stage_summary = {}
    for key, val in prior_results.items():
        if isinstance(val, dict):
            stage_summary[key] = {
                "outcome": val.get("outcome", ""),
                "confidence": val.get("confidence", ""),
                "reasoning": val.get("reasoning", "")[:100],
            }

    prompt = f"""You are a healthcare claims quality assurance validator.
Validate all stage results for claim {claim.get('claim_number')}:
Billed: ${claim.get('billed_amount', 0)}
Classification: {claim.get('classification')}

Stage Results:
{json.dumps(stage_summary, indent=2)}

Posting recommendation: {prior_results.get('stage_7', {}).get('outcome', 'N/A')}
Net payable: ${prior_results.get('stage_6', {}).get('net_amount', 0)}

Perform these validation checks:
1. Stage consistency - do outcomes align logically?
2. Amount validation - are financial amounts reasonable?
3. Confidence alignment - are confidence levels appropriate?
4. Denial code validation - if denied, are codes correct?
5. Completeness - were all required stages executed?

Determine outcome:
- "Claim Ready for Finalization" if all checks pass
- "Additional Review Required" if minor issues found
- "Re-Pend Required" if major inconsistencies detected

Return JSON:
{{
  "outcome": "...",
  "validation_checks": [
    {{"check": "...", "passed": true/false, "detail": "..."}}
  ],
  "issues_found": ["..."],
  "reasoning": "...",
  "confidence": "High" or "Medium" or "Low"
}}"""

    response = call_bedrock(prompt, max_tokens=2000)
    return parse_bedrock_json(response)


def _deterministic_validation(claim: dict, prior_results: dict) -> tuple:
    """Deterministic fallback for post-validation."""
    billed_amount = float(claim.get("billed_amount", 0) or 0)
    validation_checks = []
    issues_found = []

    # Check 1: Stage completeness
    expected_stages = ["stage_2", "stage_3", "stage_4", "stage_5", "stage_6", "stage_7"]
    missing_stages = [s for s in expected_stages if s not in prior_results]
    completeness_passed = len(missing_stages) == 0
    validation_checks.append({
        "check": "Stage Completeness",
        "passed": completeness_passed,
        "detail": f"All {len(expected_stages)} stages completed" if completeness_passed else f"Missing: {', '.join(missing_stages)}",
    })
    if not completeness_passed:
        issues_found.append(f"Missing stages: {', '.join(missing_stages)}")

    # Check 2: Outcome consistency
    stage_5_outcome = prior_results.get("stage_5", {}).get("outcome", "")
    stage_7_outcome = prior_results.get("stage_7", {}).get("outcome", "")
    stage_7_disposition = prior_results.get("stage_7", {}).get("posting_data", {}).get("disposition", "")

    # If coordination says deny but posting says pay, that's inconsistent
    consistency_passed = True
    if stage_5_outcome == "DNNPR" and stage_7_disposition == "Pay":
        consistency_passed = False
        issues_found.append("Coordination denies but posting recommends payment")
    if prior_results.get("stage_4", {}).get("outcome") == "Denied - Timely Filing" and stage_7_disposition == "Pay":
        consistency_passed = False
        issues_found.append("Timely filing denied but posting recommends payment")

    validation_checks.append({
        "check": "Outcome Consistency",
        "passed": consistency_passed,
        "detail": "All stage outcomes are logically consistent" if consistency_passed else "Inconsistency detected between stages",
    })

    # Check 3: Financial amount validation
    net_payable = float(prior_results.get("stage_6", {}).get("net_amount", 0) or 0)
    posting_net = float(prior_results.get("stage_7", {}).get("net_payable", 0) or 0)

    # Net payable should not exceed billed amount
    amount_valid = net_payable <= billed_amount and posting_net <= billed_amount
    # Net payable should not be negative
    amount_valid = amount_valid and net_payable >= 0 and posting_net >= 0

    validation_checks.append({
        "check": "Financial Amount Validation",
        "passed": amount_valid,
        "detail": f"Net payable ${net_payable:.2f} within billed ${billed_amount:.2f}" if amount_valid else f"Amount exceeds billed or is negative",
    })
    if not amount_valid:
        issues_found.append(f"Financial amount issue: net ${net_payable:.2f} vs billed ${billed_amount:.2f}")

    # Check 4: Confidence alignment
    low_confidence_stages = []
    for key, val in prior_results.items():
        if isinstance(val, dict) and val.get("confidence") == "Low":
            low_confidence_stages.append(key)

    confidence_ok = len(low_confidence_stages) == 0
    validation_checks.append({
        "check": "Confidence Alignment",
        "passed": confidence_ok,
        "detail": "All stages report Medium or High confidence" if confidence_ok else f"Low confidence in: {', '.join(low_confidence_stages)}",
    })
    if not confidence_ok:
        issues_found.append(f"Low confidence stages: {', '.join(low_confidence_stages)}")

    # Check 5: Denial code validation (if applicable)
    denial_codes = prior_results.get("stage_7", {}).get("denial_codes", [])
    if denial_codes:
        # Verify denial codes match stage outcomes
        denial_valid = True
        if "DNTF" in denial_codes and prior_results.get("stage_4", {}).get("outcome") != "Denied - Timely Filing":
            denial_valid = False
        if "DN017" in denial_codes and prior_results.get("stage_3", {}).get("outcome") != "DN017":
            denial_valid = False

        validation_checks.append({
            "check": "Denial Code Validation",
            "passed": denial_valid,
            "detail": f"Denial codes {', '.join(denial_codes)} validated against stage outcomes" if denial_valid else "Denial code mismatch",
        })
        if not denial_valid:
            issues_found.append("Denial codes do not match stage outcomes")
    else:
        validation_checks.append({
            "check": "Denial Code Validation",
            "passed": True,
            "detail": "No denial codes - payment path validated",
        })

    # Check 6: Hold code resolution
    hold_outcome = prior_results.get("stage_2", {}).get("outcome", "")
    hold_valid = hold_outcome not in ("", None)
    validation_checks.append({
        "check": "Hold Code Resolution",
        "passed": hold_valid,
        "detail": f"Hold code resolved: {hold_outcome}" if hold_valid else "Hold code not resolved",
    })

    # Determine overall outcome
    checks_failed = sum(1 for v in validation_checks if not v.get("passed", True))

    if checks_failed == 0:
        outcome = "Claim Ready for Finalization"
        confidence = "High"
        reasoning = (
            f"All {len(validation_checks)} validation checks passed. "
            f"Claim {claim.get('claim_number')} is ready for finalization. "
            f"Disposition: {stage_7_disposition or 'Pay'}."
        )
    elif checks_failed == 1 and not any("inconsistency" in i.lower() for i in issues_found):
        outcome = "Additional Review Required"
        confidence = "Medium"
        reasoning = (
            f"{checks_failed} validation check(s) failed: {'; '.join(issues_found)}. "
            f"Minor issue detected - recommend examiner review before finalization."
        )
    else:
        outcome = "Re-Pend Required"
        confidence = "Low"
        reasoning = (
            f"{checks_failed} validation check(s) failed: {'; '.join(issues_found)}. "
            f"Major inconsistencies detected - claim should be re-pended for full review."
        )

    return outcome, reasoning, confidence, validation_checks, issues_found


def _determine_final_disposition(prior_results: dict, issues_found: list) -> dict:
    """Determine the final claim disposition based on all results."""
    posting = prior_results.get("stage_7", {})
    disposition = posting.get("posting_data", {}).get("disposition", "Pay")
    net_payable = posting.get("net_payable", 0)

    if issues_found:
        return {
            "action": "Review",
            "reason": "; ".join(issues_found[:2]),
            "auto_resolve": False,
        }
    elif disposition == "Deny":
        return {
            "action": "Deny",
            "denial_codes": posting.get("denial_codes", []),
            "auto_resolve": True,
        }
    else:
        return {
            "action": "Pay",
            "amount": net_payable,
            "auto_resolve": True,
        }
