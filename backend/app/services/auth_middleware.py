from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os
from typing import Optional
from app.db.pool import get_db

security = HTTPBearer(auto_error=False)
JWT_SECRET = os.getenv("JWT_SECRET", "agentic-claims-jwt-secret-2026")


def _get_default_admin() -> dict:
    """Get the actual admin user from DB for unauthenticated requests."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, email, role, platforms FROM users WHERE role = 'admin' LIMIT 1")
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            return {
                "id": str(row[0]),
                "email": row[1],
                "role": row[2],
                "platforms": row[3] if row[3] else ["Facet", "Amisys", "Xcelys"],
            }
    except Exception:
        pass
    return {
        "id": "00000000-0000-0000-0000-000000000000",
        "email": "admin@nttdata.com",
        "role": "admin",
        "platforms": ["Facet", "Amisys", "Xcelys"],
    }


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """Decode JWT token if present, otherwise return default admin user."""
    if not credentials:
        return _get_default_admin()
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return _get_default_admin()


def require_role(*roles: str):
    """Dependency that checks user role. With no token, defaults to admin."""
    async def check(user=Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return check
