from fastapi import APIRouter, Depends
from app.db.pool import get_db
from app.services.auth_middleware import get_current_user

router = APIRouter()


@router.get("/metrics")
async def get_metrics(user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'Approved') as approved,
            COUNT(*) FILTER (WHERE status = 'Denied') as denied,
            COUNT(*) FILTER (WHERE status = 'InReview') as in_review,
            COUNT(*) FILTER (WHERE status = 'Pending') as pending,
            COALESCE(SUM(billed_amount), 0) as total_billed,
            COALESCE(AVG(confidence), 0) as avg_confidence
        FROM claims
    """)
    row = cur.fetchone()

    cur.execute("SELECT COUNT(*) FROM examiner_decisions")
    decisions = cur.fetchone()[0]

    cur.close()
    conn.close()

    return {
        "total": row[0],
        "approved": row[1],
        "denied": row[2],
        "inReview": row[3],
        "pending": row[4],
        "totalBilled": float(row[5]),
        "avgConfidence": round(float(row[6])),
        "examinerDecisions": decisions,
    }
