from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.db.pool import get_db
from app.services.auth_middleware import get_current_user, require_role

router = APIRouter()


@router.get("")
async def get_thresholds(user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM routing_thresholds WHERE id = 'global'")
    row = cur.fetchone()
    if not row:
        cur.execute("INSERT INTO routing_thresholds (id, auto_resolve, hitl_low) VALUES ('global', 92, 60) RETURNING *")
        row = cur.fetchone()
        conn.commit()
    cur.close()
    conn.close()
    return {"id": row[0], "autoResolve": row[1], "hitlLow": row[2]}


class ThresholdUpdate(BaseModel):
    autoResolve: int
    hitlLow: int


@router.put("")
async def update_thresholds(req: ThresholdUpdate, user=Depends(require_role("admin"))):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE routing_thresholds SET auto_resolve=%s, hitl_low=%s, updated_at=NOW() WHERE id='global' RETURNING *", (req.autoResolve, req.hitlLow))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return {"id": row[0], "autoResolve": row[1], "hitlLow": row[2]}
