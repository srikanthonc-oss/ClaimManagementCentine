"""Drop all tables and recreate them fresh, then seed."""
import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()

from app.db.pool import get_db, init_db


def reset():
    conn = get_db()
    cur = conn.cursor()

    print("Dropping all tables...")
    cur.execute("""
        DROP TABLE IF EXISTS audit_log CASCADE;
        DROP TABLE IF EXISTS examiner_decisions CASCADE;
        DROP TABLE IF EXISTS agent_results CASCADE;
        DROP TABLE IF EXISTS claims CASCADE;
        DROP TABLE IF EXISTS upload_history CASCADE;
        DROP TABLE IF EXISTS data_sources CASCADE;
        DROP TABLE IF EXISTS routing_thresholds CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
    """)
    conn.commit()
    cur.close()
    conn.close()
    print("All tables dropped.")

    print("Recreating tables...")
    init_db()
    print("Done. Run 'python seed.py' to create admin user.")


if __name__ == "__main__":
    reset()
