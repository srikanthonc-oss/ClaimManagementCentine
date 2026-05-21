from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
import json
import bcrypt as bcrypt_lib
from app.db.pool import get_db
from app.services.auth_middleware import require_role
from app.services.audit import log_audit

router = APIRouter()


def hash_password(password: str) -> str:
    return bcrypt_lib.hashpw(password.encode(), bcrypt_lib.gensalt()).decode()


@router.get("")
async def list_users(user=Depends(require_role("admin"))):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, email, name, role, platforms, is_active, created_at FROM users ORDER BY created_at DESC")
    cols = [desc[0] for desc in cur.description]
    rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    cur.close()
    conn.close()
    for r in rows:
        r["id"] = str(r["id"])
    return rows


class CreateUserRequest(BaseModel):
    email: str
    name: str
    password: str
    role: Optional[str] = "viewer"
    platforms: Optional[List[str]] = []


@router.post("")
async def create_user(req: CreateUserRequest, user=Depends(require_role("admin"))):
    conn = get_db()
    cur = conn.cursor()
    hashed = hash_password(req.password)
    cur.execute(
        "INSERT INTO users (email, name, password, role, platforms) VALUES (%s, %s, %s, %s, %s) RETURNING id, email, name, role, platforms",
        (req.email.lower(), req.name, hashed, req.role, json.dumps(req.platforms))
    )
    cols = [desc[0] for desc in cur.description]
    row = dict(zip(cols, cur.fetchone()))
    conn.commit()
    cur.close()
    conn.close()
    row["id"] = str(row["id"])

    try:
        log_audit(user["id"], "user_create", "user", row["id"], {"email": req.email, "role": req.role})
    except Exception:
        pass

    return row


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    platforms: Optional[List[str]] = None
    isActive: Optional[bool] = None
    password: Optional[str] = None


@router.put("/{user_id}")
async def update_user(user_id: str, req: UpdateUserRequest, user=Depends(require_role("admin"))):
    conn = get_db()
    cur = conn.cursor()
    updates = []
    params = []
    if req.name:
        updates.append("name=%s"); params.append(req.name)
    if req.role:
        updates.append("role=%s"); params.append(req.role)
    if req.platforms is not None:
        updates.append("platforms=%s"); params.append(json.dumps(req.platforms))
    if req.isActive is not None:
        updates.append("is_active=%s"); params.append(req.isActive)
    if req.password:
        updates.append("password=%s"); params.append(hash_password(req.password))

    updates.append("updated_at=NOW()")
    params.append(user_id)

    cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id=%s RETURNING id, email, name, role, platforms, is_active", params)
    cols = [desc[0] for desc in cur.description]
    row = dict(zip(cols, cur.fetchone()))
    conn.commit()
    cur.close()
    conn.close()
    row["id"] = str(row["id"])

    try:
        updates_dict = {}
        if req.name:
            updates_dict["name"] = req.name
        if req.role:
            updates_dict["role"] = req.role
        if req.platforms is not None:
            updates_dict["platforms"] = req.platforms
        if req.isActive is not None:
            updates_dict["isActive"] = req.isActive
        log_audit(user["id"], "user_update", "user", user_id, updates_dict)
    except Exception:
        pass

    return row


@router.delete("/{user_id}")
async def delete_user(user_id: str, user=Depends(require_role("admin"))):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()

    try:
        log_audit(user["id"], "user_delete", "user", user_id, None)
    except Exception:
        pass

    return {"message": "Deleted"}

