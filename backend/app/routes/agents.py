from fastapi import APIRouter, Depends
from app.db.pool import get_db
from app.services.auth_middleware import get_current_user, require_role

router = APIRouter()

# Default agents to seed if table is empty
DEFAULT_AGENTS = [
    ("intake-adapter", "Intake Adapter Agent", "Schema normalization, data extraction from XLS/EDI/PAPER sources.", "Rules Engine", "rules", "1-2", "80ms", "99.2%"),
    ("hold-code-validation", "Hold Code Validation Agent", "Validates hold/denial codes against CMS registry and plan rules.", "Rules Engine", "rules", "3", "150ms", "98.8%"),
    ("eligibility", "Eligibility Agent", "Member eligibility verification, COB history lookup, insurance matching.", "Claude Sonnet 4 (Bedrock)", "llm", "4", "1200ms", "97.1%"),
    ("timely-filing", "Timely Filing Agent", "State-specific filing rules validation, date calculations per CMS 42 CFR 424.44.", "Rules Engine", "rules", "5", "100ms", "99.5%"),
    ("coordination-rule", "Coordination Rule Agent", "Primary/secondary payer determination, NAIC birthday rule, MSP guidelines.", "Claude Sonnet 4 (Bedrock)", "llm", "6", "890ms", "96.3%"),
    ("cob-calculation", "COB Calculation Agent", "Financial calculations, allowed amounts, PR amounts, net payable.", "Rules Engine + Claude Sonnet 4", "hybrid", "7", "450ms", "98.5%"),
    ("posting", "Posting Agent", "System update recommendations, adjustment codes, hold release logic.", "Rules Engine", "rules", "8", "200ms", "99.0%"),
    ("post-validation", "Post Validation Agent", "Final compliance checks, duplicate detection, audit trail generation.", "Claude Sonnet 4 (Bedrock)", "llm", "9", "340ms", "98.2%"),
    ("resolution-orchestrator", "Resolution Orchestrator", "Orchestrates all agents, determines final recommendation (auto-resolve vs HITL).", "Claude Sonnet 4 (Bedrock)", "llm", "All", "180ms", "99.7%"),
]


def _ensure_agents_seeded():
    """Seed default agents if table is empty."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM agent_registry")
    count = cur.fetchone()[0]
    if count == 0:
        for agent in DEFAULT_AGENTS:
            cur.execute(
                "INSERT INTO agent_registry (id, name, description, model, model_type, stage, latency, success_rate) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                agent
            )
        conn.commit()
    cur.close()
    conn.close()


@router.get("")
async def list_agents(user=Depends(get_current_user)):
    """Get all agents with their enabled/disabled status."""
    _ensure_agents_seeded()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM agent_registry ORDER BY stage")
    cols = [desc[0] for desc in cur.description]
    rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    cur.close()
    conn.close()
    for r in rows:
        if r.get("updated_at"):
            r["updated_at"] = str(r["updated_at"])
    return rows


@router.put("/{agent_id}/toggle")
async def toggle_agent(agent_id: str, user=Depends(require_role("admin"))):
    """Toggle an agent's enabled/disabled status."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE agent_registry SET is_enabled = NOT is_enabled, updated_at = NOW() WHERE id = %s RETURNING id, is_enabled", (agent_id,))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        return {"error": "Agent not found"}
    return {"id": row[0], "is_enabled": row[1]}
