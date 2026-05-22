from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routes import auth, claims, data_sources, users, dashboard, thresholds, agents
from app.db.pool import init_db

load_dotenv()

app = FastAPI(
    title="Agentic AI Claim Management API",
    version="1.0.0",
    description="Backend REST API for claims processing with AI agents",
)

# Middleware to normalize trailing slashes — routes are defined without trailing slash
# but requests may come with or without
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class NormalizePathMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.scope.get("path", "")
        # Remove trailing slash (except for root "/")
        if path != "/" and path.endswith("/"):
            request.scope["path"] = path.rstrip("/")
        return await call_next(request)

app.add_middleware(NormalizePathMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(claims.router, prefix="/api/claims", tags=["Claims"])
app.include_router(data_sources.router, prefix="/api/data-sources", tags=["Data Sources"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(thresholds.router, prefix="/api/thresholds", tags=["Thresholds"])
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])


@app.get("/api/health")
async def health_check():
    from app.db.pool import get_db
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT NOW()")
        ts = cur.fetchone()[0]
        cur.close()
        conn.close()
        return {"status": "ok", "db": "connected", "timestamp": str(ts)}
    except Exception:
        return {"status": "ok", "db": "disconnected"}


@app.on_event("startup")
async def startup():
    init_db()
    print(f"Server ready | DB: {os.getenv('DB_HOST')}/{os.getenv('DB_NAME')} | Region: {os.getenv('AWS_REGION')}")
