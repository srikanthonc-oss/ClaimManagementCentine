"""Quick test: run hold code agent on one claim and print results."""
import sys
import json
sys.path.insert(0, '.')

from dotenv import load_dotenv
load_dotenv()

from app.db.pool import get_db
from app.agents.hold_code_agent import run_hold_code_agent

# Fetch one claim with a hold code
conn = get_db()
cur = conn.cursor()
cur.execute("SELECT * FROM claims WHERE hold_code IS NOT NULL AND hold_code != '' LIMIT 1")
cols = [desc[0] for desc in cur.description]
row = cur.fetchone()
cur.close()
conn.close()

if not row:
    print("No claims with hold codes found!")
    sys.exit(1)

claim = dict(zip(cols, row))
claim["id"] = str(claim["id"])
# Convert Decimal to float
for key, val in claim.items():
    if hasattr(val, "as_integer_ratio"):
        claim[key] = float(val)

print(f"Testing claim: {claim['claim_number']}")
print(f"Hold code: {claim.get('hold_code')}")
print(f"Classification: {claim.get('classification')}")
print(f"Platform: {claim.get('platform')}")
print(f"Billed: ${claim.get('billed_amount', 0)}")
print("---")

result = run_hold_code_agent(claim)

print("\n=== RESULT ===")
print(json.dumps(result, indent=2, default=str))
