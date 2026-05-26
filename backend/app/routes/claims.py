from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import json
from app.db.pool import get_db
from app.services.auth_middleware import get_current_user, require_role
from app.services.audit import log_audit

router = APIRouter()


class ClaimUploadRequest(BaseModel):
    claims: List[dict]
    fileName: str
    platform: str


class ProcessRequest(BaseModel):
    agentResult: dict


class DecisionRequest(BaseModel):
    action: str
    reason: Optional[str] = None
    notes: str


@router.get("")
async def list_claims(platform: Optional[str] = None, classification: Optional[str] = None, status: Optional[str] = None, page: int = 1, pageSize: int = 50, user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    conditions = []
    params = []

    if user["role"] != "admin" and user.get("platforms"):
        conditions.append("platform = ANY(%s)")
        params.append(user["platforms"])

    if platform:
        conditions.append("platform = %s")
        params.append(platform)
    if classification:
        conditions.append("classification = %s")
        params.append(classification)
    if status:
        conditions.append("status = %s")
        params.append(status)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    offset = (page - 1) * pageSize

    cur.execute(f"SELECT COUNT(*) FROM claims {where}", params)
    total = cur.fetchone()[0]

    cur.execute(f"SELECT * FROM claims {where} ORDER BY created_at DESC LIMIT %s OFFSET %s", params + [pageSize, offset])
    cols = [desc[0] for desc in cur.description]
    rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    cur.close()
    conn.close()

    # Convert UUIDs and decimals to strings for JSON
    for row in rows:
        row["id"] = str(row["id"])
        row["billed_amount"] = float(row["billed_amount"]) if row["billed_amount"] else 0
        row["allowed_amount"] = float(row["allowed_amount"]) if row["allowed_amount"] else None
        if row.get("upload_id"):
            row["upload_id"] = str(row["upload_id"])
        if row.get("created_at"):
            row["created_at"] = str(row["created_at"])
        if row.get("updated_at"):
            row["updated_at"] = str(row["updated_at"])

    return {"claims": rows, "total": total, "page": page, "pageSize": pageSize}


@router.get("/uploads")
async def list_uploads(user=Depends(get_current_user)):
    """Get upload history."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM upload_history ORDER BY uploaded_at DESC LIMIT 50")
    cols = [desc[0] for desc in cur.description]
    rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    cur.close()
    conn.close()
    for r in rows:
        r["id"] = str(r["id"])
        if r.get("user_id"):
            r["user_id"] = str(r["user_id"])
        if r.get("uploaded_at"):
            r["uploaded_at"] = str(r["uploaded_at"])
    return rows


@router.get("/{claim_id}")
async def get_claim(claim_id: str, user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM claims WHERE id = %s", (claim_id,))
    cols = [desc[0] for desc in cur.description]
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Claim not found")

    claim = dict(zip(cols, row))
    claim["id"] = str(claim["id"])
    claim["billed_amount"] = float(claim["billed_amount"]) if claim["billed_amount"] else 0
    claim["allowed_amount"] = float(claim["allowed_amount"]) if claim["allowed_amount"] else None

    # Get agent result
    cur.execute("SELECT * FROM agent_results WHERE claim_id = %s", (claim_id,))
    ar_cols = [desc[0] for desc in cur.description]
    ar_row = cur.fetchone()
    claim["agentResult"] = dict(zip(ar_cols, ar_row)) if ar_row else None

    # Get examiner decision
    cur.execute("SELECT ed.*, u.name as decided_by_name FROM examiner_decisions ed LEFT JOIN users u ON ed.user_id = u.id WHERE ed.claim_id = %s", (claim_id,))
    ed_cols = [desc[0] for desc in cur.description]
    ed_row = cur.fetchone()
    claim["examinerDecision"] = dict(zip(ed_cols, ed_row)) if ed_row else None

    cur.close()
    conn.close()
    return claim


@router.post("/upload")
async def upload_claims(req: ClaimUploadRequest, user=Depends(require_role("admin", "examiner"))):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO upload_history (file_name, platform, claims_count, user_id) VALUES (%s, %s, %s, %s) RETURNING id",
        (req.fileName, req.platform, len(req.claims), user["id"])
    )
    upload_id = str(cur.fetchone()[0])

    inserted = 0
    for c in req.claims:
        try:
            cur.execute("""
                INSERT INTO claims (claim_number, classification, platform, provider_name, billed_amount, allowed_amount, days_aged, state, hold_code, submit_type, claim_type, provider_specialty, subscriber_id, par_flag, form, recv_dt, raw_data, upload_id)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (claim_number) DO NOTHING
            """, (
                c.get("claimNumber"), c.get("classification"), req.platform, c.get("providerName"),
                c.get("billedAmount", 0), c.get("allowedAmount"), c.get("daysAged", 0), c.get("state"),
                c.get("holdCode"), c.get("submitType"), c.get("claimType"), c.get("providerSpecialty"),
                c.get("subscriberId"), c.get("parFlag"), c.get("form"), c.get("recvDt"),
                json.dumps(c), upload_id
            ))
            inserted += 1
        except Exception:
            pass

    conn.commit()
    cur.close()
    conn.close()

    try:
        log_audit(user["id"], "claims_upload", "upload", upload_id, {"fileName": req.fileName, "platform": req.platform, "claimsCount": inserted})
    except Exception:
        pass

    return {"upload_id": upload_id, "claimsCreated": inserted}


class ReferenceDataRequest(BaseModel):
    holdCodes: Optional[List[dict]] = []
    claimHeaders: Optional[List[dict]] = []
    claimDetails: Optional[List[dict]] = []
    denialDetails: Optional[List[dict]] = []
    cobHistory: Optional[List[dict]] = []
    eobExtraction: Optional[List[dict]] = []


@router.post("/upload-reference")
async def upload_reference_data(req: ReferenceDataRequest, user=Depends(require_role("admin", "examiner"))):
    """Upload reference data (Hold_Code_Info, Claim_Header, Claim_Detail, etc.) into agent tables."""
    conn = get_db()
    cur = conn.cursor()
    counts = {}

    # Helper to get claim_id from claim_number
    def get_cid(claim_num):
        cur.execute("SELECT id FROM claims WHERE claim_number = %s", (str(claim_num),))
        row = cur.fetchone()
        return str(row[0]) if row else None

    # Hold Codes
    inserted = 0
    for row in (req.holdCodes or []):
        cid = get_cid(row.get("claimNumber") or row.get("Claim#"))
        if cid:
            cur.execute("DELETE FROM claim_hold_codes WHERE claim_id = %s AND line_no = %s", (cid, row.get("lineNo") or row.get("Line#") or 1))
            cur.execute("INSERT INTO claim_hold_codes (claim_id, line_no, hold_code, history, reason, description) VALUES (%s,%s,%s,%s,%s,%s)",
                (cid, row.get("lineNo") or row.get("Line#") or 1, row.get("reason") or row.get("Reason") or "", row.get("history") or row.get("History") or "", row.get("reason") or row.get("Reason") or "", row.get("description") or row.get("Description") or ""))
            inserted += 1
    counts["holdCodes"] = inserted

    # Claim Headers
    inserted = 0
    for row in (req.claimHeaders or []):
        cid = get_cid(row.get("claimNumber") or row.get("Claim#"))
        if cid:
            cur.execute("DELETE FROM claim_header_detail WHERE claim_id = %s", (cid,))
            cur.execute("INSERT INTO claim_header_detail (claim_id, member_id, specialty, place_of_service, par_status, received_date) VALUES (%s,%s,%s,%s,%s,%s)",
                (cid, row.get("memberId") or row.get("Member Id") or "", row.get("specialty") or row.get("Speciality") or "", row.get("plcOfSvc") or row.get("Plc of Svc") or "", row.get("par") or row.get("Par") or "", row.get("receivedDate") or row.get("Received Date") or ""))
            inserted += 1
    counts["claimHeaders"] = inserted

    # Claim Details
    inserted = 0
    for row in (req.claimDetails or []):
        cid = get_cid(row.get("claimNumber") or row.get("Claim#"))
        if cid:
            cur.execute("INSERT INTO claim_detail_lines (claim_id, line_no, cpt, modifier, start_date, end_date, units, billed_amt, allowed_amt, copay, coinsurance, oc_paid) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                (cid, row.get("sno") or row.get("Sno") or 1, row.get("cpt") or row.get("CPT") or "", row.get("mod") or row.get("Mod") or "", row.get("startDate") or row.get("Start Date") or "", row.get("endDate") or row.get("End Date") or "", row.get("units") or row.get("Units") or 1, row.get("billedAmt") or row.get("Billed Amt") or 0, row.get("allowedAmt") or row.get("Allowed Amt") or 0, row.get("copay") or row.get("Copay") or 0, row.get("coins") or row.get("Coins") or 0, row.get("ocPaid") or row.get("OC Paid") or 0))
            inserted += 1
    counts["claimDetails"] = inserted

    # Denial Details
    inserted = 0
    for row in (req.denialDetails or []):
        cid = get_cid(row.get("claimNumber") or row.get("Claim#"))
        if cid:
            cur.execute("DELETE FROM claim_denial_details WHERE claim_id = %s", (cid,))
            cur.execute("INSERT INTO claim_denial_details (claim_id, line_no, history, reason_code) VALUES (%s,%s,%s,%s)",
                (cid, row.get("lineNo") or row.get("Line#") or 1, row.get("history") or row.get("History") or "", row.get("reasonCode") or row.get("Rsn Code") or ""))
            inserted += 1
    counts["denialDetails"] = inserted

    # COB History
    inserted = 0
    for row in (req.cobHistory or []):
        cid = get_cid(row.get("claimNumber") or row.get("Claim#"))
        if cid:
            cur.execute("INSERT INTO claim_cob_history (claim_id, sno, primary_insurance, effective_date, term_date) VALUES (%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                (cid, row.get("sno") or row.get("Sno") or 1, row.get("primaryInsurance") or row.get("Primary Insurance") or "", row.get("effectiveDate") or row.get("Effective Date") or "", row.get("termDate") or row.get("Term Date") or ""))
            inserted += 1
    counts["cobHistory"] = inserted

    # EOB Extraction
    inserted = 0
    for row in (req.eobExtraction or []):
        cid = get_cid(row.get("claimNumber") or row.get("Claim#"))
        if cid:
            cur.execute("DELETE FROM claim_eob_extraction WHERE claim_id = %s", (cid,))
            cur.execute("INSERT INTO claim_eob_extraction (claim_id, sno, cpt, insurance_name, paid_amt, adj_grp_code, reason_code, pr_amount) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (cid, row.get("sno") or row.get("Sno") or 1, row.get("cpt") or row.get("CPT") or "", row.get("insuranceName") or row.get("Insurance Name") or "", row.get("paidAmt") or row.get("Paid Amt") or 0, row.get("adjGrpCode") or row.get("Adj Grp Code") or "", row.get("reason") or row.get("Rsn") or "", row.get("prAmount") or row.get("PR amount") or 0))
            inserted += 1
    counts["eobExtraction"] = inserted

    conn.commit()
    cur.close()
    conn.close()

    try:
        log_audit(user["id"], "reference_upload", "reference", None, counts)
    except Exception:
        pass

    return {"message": "Reference data uploaded", "counts": counts}


@router.post("/{claim_id}/run-agents")
async def run_agents(claim_id: str, user=Depends(require_role("admin", "examiner"))):
    """Run the full 8-stage agent pipeline for a claim."""
    from app.agents.orchestrator import run_orchestrator

    result = run_orchestrator(claim_id)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    try:
        from app.services.audit import log_audit
        log_audit(user["id"], "claims_run_agents", "claim", claim_id, {"confidence": result.get("confidence"), "status": result.get("status")})
    except Exception:
        pass

    return result


@router.get("/{claim_id}/agent-output")
async def get_agent_output(claim_id: str, user=Depends(get_current_user)):
    """Get the full agent pipeline output for a claim (all 8 stages)."""
    conn = get_db()
    cur = conn.cursor()

    # Get stage outputs
    cur.execute("""
        SELECT stage_number, stage_name, agent_name, output_data, outcome, confidence, reasoning, executed_at
        FROM agent_stage_outputs WHERE claim_id = %s ORDER BY stage_number
    """, (claim_id,))
    cols = [desc[0] for desc in cur.description]
    stages = [dict(zip(cols, row)) for row in cur.fetchall()]

    # Get extracted data
    cur.execute("SELECT * FROM claim_hold_codes WHERE claim_id = %s ORDER BY line_no", (claim_id,))
    hold_codes = [dict(zip([d[0] for d in cur.description], row)) for row in cur.fetchall()]

    cur.execute("SELECT * FROM claim_detail_lines WHERE claim_id = %s ORDER BY line_no", (claim_id,))
    detail_lines = [dict(zip([d[0] for d in cur.description], row)) for row in cur.fetchall()]

    cur.execute("SELECT * FROM claim_cob_history WHERE claim_id = %s ORDER BY sno", (claim_id,))
    cob_history = [dict(zip([d[0] for d in cur.description], row)) for row in cur.fetchall()]

    cur.execute("SELECT * FROM claim_eob_extraction WHERE claim_id = %s ORDER BY sno", (claim_id,))
    eob_extraction = [dict(zip([d[0] for d in cur.description], row)) for row in cur.fetchall()]

    cur.execute("SELECT * FROM claim_denial_details WHERE claim_id = %s ORDER BY line_no", (claim_id,))
    denial_details = [dict(zip([d[0] for d in cur.description], row)) for row in cur.fetchall()]

    cur.execute("SELECT * FROM claim_header_detail WHERE claim_id = %s", (claim_id,))
    header_row = cur.fetchone()
    header_detail = dict(zip([d[0] for d in cur.description], header_row)) if header_row else None

    cur.close()
    conn.close()

    # Serialize UUIDs and datetimes
    def serialize(obj):
        if isinstance(obj, list):
            return [serialize(item) for item in obj]
        if isinstance(obj, dict):
            return {k: str(v) if hasattr(v, 'hex') or hasattr(v, 'isoformat') else (float(v) if hasattr(v, 'as_integer_ratio') else v) for k, v in obj.items()}
        return obj

    return {
        "stages": serialize(stages),
        "extracted_data": {
            "hold_codes": serialize(hold_codes),
            "detail_lines": serialize(detail_lines),
            "cob_history": serialize(cob_history),
            "eob_extraction": serialize(eob_extraction),
            "denial_details": serialize(denial_details),
            "header_detail": serialize(header_detail),
        }
    }


@router.get("/{claim_id}/agent-output/stage/{stage_number}")
async def get_agent_stage_output(claim_id: str, stage_number: int, user=Depends(get_current_user)):
    """Get a single stage output for a claim — used for lazy loading in the view popup."""
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT stage_number, stage_name, agent_name, output_data, outcome, confidence, reasoning, executed_at
        FROM agent_stage_outputs WHERE claim_id = %s AND stage_number = %s
    """, (claim_id, stage_number))
    cols = [desc[0] for desc in cur.description]
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Stage {stage_number} not found for claim {claim_id}")

    def serialize(obj):
        if isinstance(obj, list):
            return [serialize(item) for item in obj]
        if isinstance(obj, dict):
            return {k: str(v) if hasattr(v, 'hex') or hasattr(v, 'isoformat') else (float(v) if hasattr(v, 'as_integer_ratio') else v) for k, v in obj.items()}
        return obj

    return serialize(dict(zip(cols, row)))


@router.post("/{claim_id}/process")
async def process_claim(claim_id: str, req: ProcessRequest, user=Depends(require_role("admin", "examiner"))):
    """Store agent processing result for a claim and update its status/confidence."""
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT claim_number FROM claims WHERE id = %s", (claim_id,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Claim not found")

    claim_number = row[0]
    agent_result = req.agentResult

    # Extract confidence and recommendation from agent result
    confidence_data = agent_result.get("confidenceBreakdown", {})
    overall_confidence = confidence_data.get("overall", 0)
    recommendation = agent_result.get("recommendation", "review")
    reasoning_summary = agent_result.get("reasoningSummary", "")

    # Insert or update agent_results
    cur.execute("""
        INSERT INTO agent_results (claim_id, claim_number, result_data, confidence, recommendation, reasoning_summary)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (claim_id) DO UPDATE SET
            result_data = %s, confidence = %s, recommendation = %s, reasoning_summary = %s, processed_at = NOW()
    """, (
        claim_id, claim_number, json.dumps(agent_result), json.dumps(confidence_data), recommendation, reasoning_summary,
        json.dumps(agent_result), json.dumps(confidence_data), recommendation, reasoning_summary
    ))

    # Update claim status based on confidence
    # Read routing thresholds
    cur.execute("SELECT auto_resolve FROM routing_thresholds WHERE id = 'global'")
    threshold_row = cur.fetchone()
    auto_resolve_threshold = threshold_row[0] if threshold_row else 92

    new_status = "Approved" if overall_confidence >= auto_resolve_threshold else "InReview"
    cur.execute("UPDATE claims SET status = %s, confidence = %s, updated_at = NOW() WHERE id = %s",
                (new_status, overall_confidence, claim_id))

    conn.commit()
    cur.close()
    conn.close()

    try:
        log_audit(user["id"], "claims_process", "claim", claim_id, {"confidence": overall_confidence, "status": new_status})
    except Exception:
        pass

    return {"status": new_status, "confidence": overall_confidence, "claim_id": claim_id}


@router.post("/{claim_id}/decide")
async def decide_claim(claim_id: str, req: DecisionRequest, user=Depends(require_role("admin", "examiner"))):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM claims WHERE id = %s", (claim_id,))
    if not cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Claim not found")

    cur.execute("""
        INSERT INTO examiner_decisions (claim_id, user_id, action, reason, notes)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (claim_id) DO UPDATE SET user_id=%s, action=%s, reason=%s, notes=%s, decided_at=NOW()
    """, (claim_id, user["id"], req.action, req.reason, req.notes, user["id"], req.action, req.reason, req.notes))

    new_status = "Pending"
    if req.action == "approve":
        new_status = "Approved"
        # Keep original AI confidence — don't override to 100
        cur.execute("UPDATE claims SET status=%s, updated_at=NOW() WHERE id=%s", (new_status, claim_id))
    elif req.action == "deny":
        new_status = "Denied"
        # Keep original AI confidence — don't reset to 0
        cur.execute("UPDATE claims SET status=%s, updated_at=NOW() WHERE id=%s", (new_status, claim_id))
    else:
        # manual-review — keep confidence, change status to show it needs manual processing
        new_status = "Pending"
        cur.execute("UPDATE claims SET status=%s, updated_at=NOW() WHERE id=%s", (new_status, claim_id))
    conn.commit()
    cur.close()
    conn.close()

    try:
        log_audit(user["id"], "claims_decide", "claim", claim_id, {"action": req.action, "reason": req.reason})
    except Exception:
        pass

    return {"status": new_status, "action": req.action}


@router.delete("")
async def clear_all(user=Depends(require_role("admin"))):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM examiner_decisions")
    cur.execute("DELETE FROM agent_results")
    cur.execute("DELETE FROM claims")
    cur.execute("DELETE FROM upload_history")
    conn.commit()
    cur.close()
    conn.close()

    try:
        log_audit(user["id"], "claims_clear_all", "claims", None, None)
    except Exception:
        pass

    return {"message": "All claims cleared"}
