"""Seed the database with default admin user and thresholds."""
import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()

from passlib.context import CryptContext
from app.db.pool import get_db
import json
import bcrypt as bcrypt_lib

def hash_password(password: str) -> str:
    return bcrypt_lib.hashpw(password.encode(), bcrypt_lib.gensalt()).decode()


def seed():
    conn = get_db()
    cur = conn.cursor()

    # Create admin user
    hashed = hash_password("admin123")
    cur.execute("""
        INSERT INTO users (email, name, password, role, platforms, is_active)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (email) DO NOTHING
    """, ("admin@nttdata.com", "Admin", hashed, "admin", json.dumps(["Facet", "Amisys", "Xcelys"]), True))

    # Create default thresholds
    cur.execute("""
        INSERT INTO routing_thresholds (id, auto_resolve, hitl_low)
        VALUES ('global', 92, 60)
        ON CONFLICT (id) DO NOTHING
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("Seed completed: admin@nttdata.com / admin123")


if __name__ == "__main__":
    seed()
