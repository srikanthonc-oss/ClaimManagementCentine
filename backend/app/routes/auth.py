from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta
import os
import bcrypt as bcrypt_lib
from app.db.pool import get_db
from app.services.audit import log_audit

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "agentic-claims-jwt-secret")
JWT_EXPIRES_HOURS = 168  # 7 days


def hash_password(password: str) -> str:
    return bcrypt_lib.hashpw(password.encode(), bcrypt_lib.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt_lib.checkpw(password.encode(), hashed.encode())


class SignInRequest(BaseModel):
    email: str
    password: str


class SignUpRequest(BaseModel):
    email: str
    name: str
    password: str


def create_token(user: dict) -> str:
    payload = {
        "id": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "platforms": user["platforms"],
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRES_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@router.post("/sign-in")
async def sign_in(req: SignInRequest):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = %s", (req.email.lower(),))
    cols = [desc[0] for desc in cur.description]
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = dict(zip(cols, row))

    if not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_token(user)

    try:
        log_audit(str(user["id"]), "sign_in", "user", str(user["id"]), {"email": user["email"]})
    except Exception:
        pass

    return {
        "token": token,
        "user": {"id": str(user["id"]), "email": user["email"], "name": user["name"], "role": user["role"], "platforms": user["platforms"]}
    }


@router.post("/sign-up")
async def sign_up(req: SignUpRequest):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = %s", (req.email.lower(),))
    if cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=409, detail="Account already exists")

    hashed = hash_password(req.password)
    cur.execute(
        "INSERT INTO users (email, name, password, role, platforms) VALUES (%s, %s, %s, %s, %s) RETURNING *",
        (req.email.lower(), req.name, hashed, "viewer", "[]")
    )
    cols = [desc[0] for desc in cur.description]
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    user = dict(zip(cols, row))
    token = create_token(user)
    return {
        "token": token,
        "user": {"id": str(user["id"]), "email": user["email"], "name": user["name"], "role": user["role"], "platforms": user["platforms"]}
    }
