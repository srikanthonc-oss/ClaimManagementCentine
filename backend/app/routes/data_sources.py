from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
import json
from app.db.pool import get_db
from app.services.auth_middleware import get_current_user, require_role
from app.services.audit import log_audit

router = APIRouter()


@router.get("")
async def list_data_sources(user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM data_sources ORDER BY created_at DESC")
    cols = [desc[0] for desc in cur.description]
    rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    cur.close()
    conn.close()
    for r in rows:
        r["id"] = str(r["id"])
    return rows


class DataSourceRequest(BaseModel):
    name: str
    type: str
    config: Optional[dict] = {}
    status: Optional[str] = "active"


@router.post("")
async def create_data_source(req: DataSourceRequest, user=Depends(require_role("admin"))):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO data_sources (name, type, config, status) VALUES (%s, %s, %s, %s) RETURNING *",
        (req.name, req.type, json.dumps(req.config), req.status)
    )
    cols = [desc[0] for desc in cur.description]
    row = dict(zip(cols, cur.fetchone()))
    conn.commit()
    cur.close()
    conn.close()
    row["id"] = str(row["id"])

    try:
        log_audit(user["id"], "datasource_create", "data_source", row["id"], {"name": req.name, "type": req.type})
    except Exception:
        pass

    return row


@router.put("/{ds_id}")
async def update_data_source(ds_id: str, req: DataSourceRequest, user=Depends(require_role("admin"))):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "UPDATE data_sources SET name=%s, type=%s, config=%s, status=%s, updated_at=NOW() WHERE id=%s RETURNING *",
        (req.name, req.type, json.dumps(req.config), req.status, ds_id)
    )
    cols = [desc[0] for desc in cur.description]
    row = dict(zip(cols, cur.fetchone()))
    conn.commit()
    cur.close()
    conn.close()
    row["id"] = str(row["id"])

    try:
        log_audit(user["id"], "datasource_update", "data_source", ds_id, {"name": req.name})
    except Exception:
        pass

    return row


@router.delete("/{ds_id}")
async def delete_data_source(ds_id: str, user=Depends(require_role("admin"))):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM data_sources WHERE id = %s", (ds_id,))
    conn.commit()
    cur.close()
    conn.close()

    try:
        log_audit(user["id"], "datasource_delete", "data_source", ds_id, None)
    except Exception:
        pass

    return {"message": "Deleted"}
