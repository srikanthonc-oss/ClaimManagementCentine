# Agentic AI Claim Management — Demo Guide

A step-by-step script for presenting the Agentic AI Claim Management system. Total runtime: 15–20 minutes.

---

## Pre-Demo Setup

Complete these steps before the audience arrives:

### 1. Start Backend
```bash
cd backend
python run.py
# Verify: "Server ready | DB: ... | Region: us-east-1"
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
# Verify: "Ready on http://localhost:3000"
```

### 3. Verify Services
```bash
curl http://localhost:4000/api/health
# Expected: {"status":"ok","db":"connected","timestamp":"..."}
```

### 4. Browser Setup
- Open `http://localhost:3000` in Chrome
- Clear any previous session (logout if needed)
- Have a second tab ready for the backend health endpoint

### 5. Data Files Ready
- Claims inventory XLS file (55 claims) — on desktop
- Reference data XLS file (hold codes, EOBs, COB history) — on desktop

### 6. Ensure Data Source Configured
- Login as admin, go to Data Sources
- Confirm "Xcelys" is listed and active
- If not, create it: Name=Xcelys, Type=claims-platform, Status=active

---

## Demo Flow

---

### Act 1: Introduction (2 minutes)

**Show:** Sign-in page at `http://localhost:3000/sign-in`

**Say:**
> "This is an AI-powered claims adjudication system built for Health Plan payer organizations. It uses 9 specialized AI agents to automatically resolve COB — Coordination of Benefits — pends that traditionally require manual examiner review."

**Action:** Login as `admin@nttdata.com` / `admin123`

**Say:**
> "The system is built on Next.js for the frontend and Python FastAPI on the backend, with AWS Bedrock Claude Sonnet 4 powering the AI reasoning. All data persists in PostgreSQL — nothing is stored in the browser."

**Show:** The sidebar navigation — point out the main sections.

---

### Act 2: Data Sources & File Intake (3 minutes)

**Navigate to:** Data Sources page

**Say:**
> "First, let's look at how data enters the system. In production, agents would connect directly to core claims platforms like Xcelys, Facet, or Amisys. For this demo, we upload Excel files that simulate the data these systems would provide."

**Show:** Xcelys data source configured and active.

**Navigate to:** File Intake page

**Action:** Upload the claims inventory XLS file (55 claims)

**Say:**
> "I'm uploading a claims inventory — 55 COB pended claims. The system parses the Excel file, normalizes the schema, and stores each claim in PostgreSQL."

**Show:** The claims grid populating with 55 rows.

**Action:** Upload the reference data XLS file

**Say:**
> "Now I'm uploading the reference data — hold codes, claim detail lines, COB history, and EOB extractions. In production, the Intake Adapter agent would pull this from eligibility systems and document stores automatically."

**Show:** "Reference data uploaded" success message with counts.

---

### Act 3: Agent Registry (2 minutes)

**Navigate to:** AI Functions / Agent Registry page

**Say:**
> "Here are our 9 specialized agents. Each has a specific role in the pipeline."

**Show:** The agent list with pipeline visualization.

**Point out:**
- **Model types:** "Some agents use a Rules Engine for deterministic logic — timely filing, hold code validation. Others use Claude Sonnet 4 via AWS Bedrock for complex reasoning — eligibility verification, coordination rules."
- **Stats:** "Each agent shows latency and success rate from production runs."

**Action:** Toggle one agent off, then back on.

**Say:**
> "Admins can enable or disable any agent. If an agent is disabled, the pipeline skips that stage and notes it in the output."

---

### Act 4: COB Pipeline (2 minutes)

**Navigate to:** COB Pipeline page

**Say:**
> "This is the decision tree every claim goes through — 8 stages from data extraction to final validation."

**Action:** Click through each of the 8 steps.

**For each step, show:**
- **AI Reasoning** — what the LLM evaluates
- **Traditional Automation** — deterministic rules applied
- **HITL (Human-in-the-Loop)** — when human review is triggered

**Say:**
> "The pipeline combines AI reasoning with traditional rules. If the AI confidence is high enough, the claim auto-resolves. If not, it routes to a human examiner with all the analysis pre-done."

---

### Act 5: Claim Execution — THE MAIN EVENT (5 minutes)

**Navigate to:** Pend Processing / Claim Execution Workbench

**Action:** Select the Xcelys platform checkbox

**Show:** 55 claims appear in the grid.

**Say:**
> "Here's our workbench. All 55 uploaded claims are ready for processing. Let me select a couple to run through the full agent pipeline."

**Action:** Select 2 claims using checkboxes

**Action:** Click "Run Pend Resolution (2)"

**Say:**
> "The backend is now running all 8 agents sequentially for each claim. Each agent reads from the database, applies its logic — either rules-based or AI-powered — and writes its output back."

**Wait:** For processing to complete (10–30 seconds per claim)

**Show:** Results appear — claims move to "Auto-Resolved" or "Needs Human Review" tabs.

**Action:** Click "View" on a processed claim

**Say:**
> "Let's look at the full 8-stage COB Decision Tree output."

**Walk through each stage:**

| Stage | What to Show | What to Say |
|-------|-------------|-------------|
| 1 | AI Summary bullets | "The intake agent extracted and summarized the key claim data" |
| 2 | Hold code validation | "COBOC identified, history is blank — this is a valid COB pend" |
| 3 | Member eligibility | "Medicare verified as primary, EOB matched to the claim" |
| 4 | Timely filing | "Filed within 365 days of the EOB date — passes timely filing" |
| 5 | Coordination rule | "Based on PR-3 adjustment code, we pay as secondary" |
| 6 | COB Calculation | "Here's the financial table — allowed amount minus primary paid equals our net payable" |
| 7 | Posting | "System recommends releasing the hold and posting the calculated amount" |
| 8 | Post validation | "All 6 compliance checks passed — no duplicates, amounts balance, audit trail complete" |

**Say:**
> "All of this data is persisted in PostgreSQL. If I refresh the page, everything is still here. Each stage's reasoning is stored in the `agent_stage_outputs` table."

---

### Act 6: Examiner Decision (2 minutes)

**Navigate to:** "Needs Human Review" tab

**Action:** Click "View" on a claim that needs review

**Say:**
> "When confidence is below the auto-resolve threshold, the claim routes here. The examiner sees all 8 stages of analysis — the AI has done the heavy lifting, but a human makes the final call."

**Show:** The full 8-stage analysis for this claim.

**Action:** Make a decision — click "Approve" (or "Deny" or "Manual Processing Required")

**Say:**
> "The examiner can approve, deny, or flag for manual processing. The decision is recorded with the examiner's name, timestamp, and reason."

**Show:** The decision record appears when re-viewing the claim.

---

### Act 7: Dashboard (2 minutes)

**Navigate to:** Dashboard

**Show the metrics cards:**
- Total Pended Claims
- Auto-Resolved %
- Needs HITL count
- Value at Risk (total billed amount)

**Show:** Pend Mix by Category breakdown

**Show:** HITL Queue (claims awaiting examiner review)

**Say:**
> "Everything here is real-time from the database. As claims are processed and decisions are made, these numbers update automatically. Operations managers use this to track throughput and identify bottlenecks."

---

### Act 8: Routing Thresholds (1 minute)

**Navigate to:** Routing Thresholds page

**Show:** Current thresholds (default: 92% auto-resolve, 60% HITL low)

**Say:**
> "This is where admins configure the routing logic. Claims with confidence at or above 92% auto-resolve. Below that, they go to human review. This is fully configurable — you can tighten or loosen the threshold based on risk tolerance."

**Action:** Change the auto-resolve threshold (e.g., 95%) to show it's dynamic.

**Say:**
> "If we raise this to 95%, more claims will route to human review. Lower it, and more auto-resolve. The business controls the risk dial."

**Action:** Reset to 92% (or leave as-is for demo purposes).

---

## Key Talking Points

Use these throughout the demo as natural conversation points:

- "9 specialized AI agents, each with a specific role in the COB resolution pipeline"
- "AWS Bedrock Claude Sonnet 4 for complex reasoning, Rules Engine for deterministic logic"
- "Fallback design: if Bedrock is unavailable, deterministic logic still processes claims"
- "Full audit trail — every action is logged with user, timestamp, and details"
- "Data persists in PostgreSQL — no localStorage dependency, production-ready architecture"
- "Role-based access: Admin configures the system, Examiner makes decisions, Viewer observes"
- "The AI doesn't replace the examiner — it does the analysis so the examiner can decide faster"
- "Each claim's 8-stage reasoning is fully transparent and auditable"

---

## Q&A Preparation

### "How does it handle Bedrock failures?"
> The system has a deterministic fallback. Each agent has rules-based logic that runs independently of the LLM. If Bedrock is unavailable or times out, the rules engine still processes the claim — just with lower confidence, which routes it to human review. No claims are lost or stuck.

### "Where is the data stored?"
> Everything is in PostgreSQL on AWS RDS. 22 tables covering claims, agent outputs, user management, audit logs, and configuration. No data lives in the browser — the frontend is purely a presentation layer that calls the REST API.

### "Can it scale?"
> Yes. FastAPI is async and handles concurrent requests efficiently. AWS Bedrock scales automatically — no infrastructure to manage for the AI layer. The database is on RDS with read replicas available. For high volume, you'd add a queue (SQS) between the API and agent execution.

### "What about real integrations?"
> The agents are designed with an adapter pattern. Currently, they read from PostgreSQL tables that we populate via file upload. In production, the Intake Adapter agent would call Xcelys/Facet/Amisys APIs directly, the Eligibility agent would hit the eligibility system, and the EOB agent would pull from document stores. The pipeline logic stays the same — only the data source changes.

### "How is it secured?"
> JWT authentication on every API call. Role-based access control (Admin/Examiner/Viewer). All actions logged in the audit table. Passwords hashed with bcrypt. CORS configured for the frontend origin. In production, you'd add VPC isolation, WAF, and Cognito integration.

### "What's the accuracy?"
> In testing with COB pends, the pipeline achieves 92–97% confidence on straightforward cases (clear primary/secondary determination). Complex cases (multiple insurances, disputed EOBs) route to human review by design. The system is conservative — it's better to route to a human than auto-resolve incorrectly.

### "How long does processing take?"
> Per claim: 5–15 seconds for the full 8-stage pipeline (most time is Bedrock inference). Batch processing of 55 claims takes 2–5 minutes. In production with parallel execution, throughput would be significantly higher.

### "Can we add new agents?"
> Yes. The agent registry is database-driven. New agents extend the `base_agent.py` class, implement their logic, and register in the `agent_registry` table. The orchestrator picks them up automatically based on their stage number.

---

## Demo Recovery Tips

| Issue | Fix |
|-------|-----|
| Backend won't start | Check `.env` — verify DB_HOST and credentials. Run `python -c "from app.db.pool import get_db; get_db()"` to test connection. |
| No claims showing | Re-upload the XLS file. Check the platform filter matches "Xcelys". |
| Agent execution fails | Check AWS credentials in `.env`. Verify Bedrock model access in us-east-1. System falls back to rules if Bedrock is down. |
| Login fails | Run `python seed.py` to recreate the admin user. |
| Database empty | Run `python -c "from app.db.pool import init_db; init_db()"` then `python seed.py`. |
| Frontend can't reach backend | Verify `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:4000`. Check backend is running on port 4000. |

---

## Post-Demo Cleanup (Optional)

```bash
# Reset all claims data (keeps users and config)
curl -X DELETE http://localhost:4000/api/claims \
  -H "Authorization: Bearer <admin-token>"

# Or reset entire database
cd backend
python reset_db.py
python seed.py
```
