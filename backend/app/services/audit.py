import json
from app.db.pool import get_db


def log_audit(user_id: str, action: str, entity: str = None, entity_id: str = None, details: dict = None):
    """Insert an audit log entry."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (%s, %s, %s, %s, %s)",
            (user_id if user_id != "00000000-0000-0000-0000-000000000000" else None, action, entity, entity_id, json.dumps(details) if details else None)
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception:
        pass  # Don't let audit logging break the main flow
