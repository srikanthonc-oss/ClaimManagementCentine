# Agentic AI COB Pend Resolution — End-to-End Solution Flow

## Executive Summary

This document describes the complete end-to-end flow of the Agentic AI COB Pend Resolution solution — from receiving pended claims from core claims platforms, through multi-agent AI analysis and determination, to final posting back to both the core application and BPM (Business Process Management) application.

---

## 1. Solution Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        HEALTH PLAN PAYER ECOSYSTEM                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Xcelys    │    │   Facets    │    │   Amisys    │    │    QNXT     │  │
│  │ (Core Claims│    │ (Core Claims│    │ (Core Claims│    │ (Core Claims│  │
│  │  Platform)  │    │  Platform)  │    │  Platform)  │    │  Platform)  │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│         └──────────────────┼──────────────────┼──────────────────┘          │
│                            │                  │                              │
│                            ▼                  ▼                              │
│              ┌─────────────────────────────────────┐                        │
│              │     PEND EVENT TRIGGER (PND-007)    │                        │
│              │     COB Pend Queue / DBPMS          │                        │
│              └──────────────────┬──────────────────┘                        │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              AGENTIC AI COB RESOLUTION ENGINE                        │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Resolution Orchestrator (Claude Sonnet 4 / Bedrock)           │  │   │
│  │  │                                                                │  │   │
│  │  │  Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5 → Stage 6  │  │   │
│  │  │  → Stage 7 → Stage 8                                          │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────┬───────────────────────────────────────┘   │
│                                 │                                            │
│                    ┌────────────┼────────────┐                              │
│                    ▼            ▼            ▼                              │
│         ┌──────────────┐ ┌──────────┐ ┌──────────────┐                     │
│         │ Core Claims  │ │   BPM    │ │  HITL Queue  │                     │
│         │ (Writeback)  │ │ (Case    │ │ (Examiner    │                     │
│         │              │ │  Update) │ │  Workbench)  │                     │
│         └──────────────┘ └──────────┘ └──────────────┘                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Ingestion — How the Solution Receives Data

### 2.1 Pend Event Trigger

The solution receives claims through a **pend event** from the core claims platform:

| Source | Trigger | Data Received |
|--------|---------|---------------|
| Xcelys / Facets / Amisys / QNXT | PND-007 COB pend event | Claim number, hold codes, billed amount, provider, member, classification |
| DBPMS (Database Process Management System) | Batch pend queue | Bulk claims with COB hold codes (COBOC, COBHD, COBPR) |

### 2.2 Data Extraction by Agents

Once a claim enters the pipeline, agents extract data from multiple systems:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA EXTRACTION PHASE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Agent 1 (Intake Adapter)                                       │
│  ├── Core Claims Platform → Claim Header, Hold Codes            │
│  ├── Claims Detail System → CPT lines, amounts, dates           │
│  └── Denial System → Denial reason codes                        │
│                                                                 │
│  Agent 3 (Eligibility)                                          │
│  ├── Member360 / Eligibility API → COB History, coverage dates  │
│  ├── EDI Gateway (270/271) → Real-time eligibility inquiry      │
│  └── AWS S3 (claim-images) → EOB documents, OCR extraction     │
│                                                                 │
│  Agent 4 (Timely Filing)                                        │
│  └── State Rules Registry → Filing limits per state             │
│                                                                 │
│  Agent 5 (Coordination)                                         │
│  ├── Authorization/UM System → Auth status for services         │
│  └── InterQual/MCG → Medical policy criteria                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Systems Interacted With (Data Sources)

| System | Purpose | Data Retrieved | Protocol |
|--------|---------|---------------|----------|
| **Core Claims Platform** (Xcelys/Facets/Amisys) | Claim header, detail lines, hold codes | Claim#, CPT, amounts, dates, provider | API / DB query |
| **Member360 (Eligibility Hub)** | Member coverage, COB history | Insurance carriers, effective/term dates | API |
| **EDI Gateway** | Real-time eligibility verification | 270/271 transactions | EDI X12 |
| **AWS S3 (claim-images)** | EOB documents, claim forms | Scanned images, OCR text | S3 signed URLs |
| **State Rules Registry** | Timely filing rules per state | Filing limits (KY=365d, TX=95d, etc.) | Rules Engine |
| **Authorization/UM System** | Prior authorization status | Auth numbers, approved services | API |
| **InterQual/MCG** | Medical policy criteria | Coverage determination rules | API |
| **CMS Code Registry** | Hold/denial code validation | Code descriptions, processing rules | Lookup table |
| **Fee Schedule** | Allowed amount determination | Contracted rates per CPT | DB query |
| **Fraud Detection (ML Pipeline)** | Risk scoring | Fraud probability, sanctions flags | ML API |

---

## 3. Analysis & Determination — The 8-Stage Pipeline

### 3.1 Pipeline Execution Flow

```
CLAIM RECEIVED
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: AI Extracted Data Summary                          │
│ Agent: Intake Adapter (Rules Engine)                        │
│ Action: Normalize schema, extract fields, generate summary  │
│ Output: Canonical claim record + summary bullets            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: Hold & Denial Code Validation                      │
│ Agent: Hold Code Validation (Rules Engine)                  │
│ Action: Validate COBOC/COBHD, check History≠"H", EXDUC     │
│ Decision: Continue / Already Processed / Duplicate          │
│ Gate: If "Already Processed" → STOP (no further processing) │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: Member Eligibility & COB Verification              │
│ Agent: Eligibility Agent (Claude Sonnet 4 / Bedrock)        │
│ Action: Verify coverage dates, match EOB to primary carrier │
│ Decision: Verified / DN017 / DN018 / DNEOB                  │
│ Gate: If DN017/DN018/DNEOB → Route to DENIAL posting        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 4: Timely Filing Validation                           │
│ Agent: Timely Filing Agent (Rules Engine)                   │
│ Action: Calculate DOS-to-Received date diff, apply state    │
│         rules (KY=365d, TX=365d, FL=365d)                   │
│ Decision: Passed / Denied - Timely Filing                   │
│ Gate: If "Denied" → Route to DENIAL posting                 │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 5: Coordination Rule Determination                    │
│ Agent: Coordination Rule Agent (Claude Sonnet 4 / Bedrock)  │
│ Action: Interpret EOB PR/CO codes, determine action type    │
│ Rules:                                                      │
│   PR 96/204 → Pay as Primary                                │
│   PR 1/2/3  → Pay as Secondary (Coordination)              │
│   CO 45     → Deny (DNNPR)                                  │
│ Decision: Pay Primary / Pay Secondary / DNNPR               │
│ Gate: If DNNPR → Route to DENIAL posting                    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 6: COB Calculation                                    │
│ Agent: COB Calculation Agent (Rules + Claude Sonnet 4)      │
│ Action: Apply 3-condition COB formula per CPT line          │
│ Formula:                                                    │
│   Cond 1: OC Paid > PR → Non-Covered = (OC Paid-Allowed)-PR│
│   Cond 2: OC Paid < PR → Non-Covered = 0, Net = 0          │
│   Cond 3: OC Paid = 0  → Non-Covered = 0, Allowed = PR     │
│ Output: Net payable amount, non-covered, adjustments        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 7: Posting Recommendation                             │
│ Agent: Posting Agent (Rules Engine)                         │
│ Action: Generate system update instructions                 │
│ Output:                                                     │
│   - Detail Screen: Allowed amount, Non-covered, Reason      │
│   - Alt+WD Screen: Denial codes, Denial reasons             │
│   - Coordination: DN001 removal, Auth updates               │
│ Decision: Ready for Posting / Posting Exception             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 8: Post Validation                                    │
│ Agent: Post Validation Agent (Claude Sonnet 4 / Bedrock)    │
│ Action: 6-point compliance validation                       │
│ Checks:                                                     │
│   1. Stage completeness                                     │
│   2. Outcome consistency                                    │
│   3. Financial amount validation                            │
│   4. Confidence alignment                                   │
│   5. Denial code validation                                 │
│   6. Hold code resolution                                   │
│ Decision: Finalize / Additional Review / Re-Pend            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ RESOLUTION ORCHESTRATOR — FINAL DETERMINATION               │
│                                                             │
│ Calculate overall confidence from all 8 stages              │
│                                                             │
│ IF confidence >= threshold (92%) → AUTO-RESOLVE             │
│ IF confidence < threshold        → ROUTE TO HITL            │
│ IF any stage DENIED              → AUTO-DENY                │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
     │ AUTO-RESOLVE │ │ AUTO-DENY│ │  HITL QUEUE  │
     │ (Post claim) │ │ (Deny)   │ │ (Human review│
     └──────┬───────┘ └────┬─────┘ └──────┬───────┘
            │              │              │
            ▼              ▼              ▼
         POSTING        POSTING      EXAMINER
         (Stage 7)     (Denial)     DECISION
```

### 3.2 Confidence Scoring

Each agent contributes to the overall confidence:

| Agent | Confidence Weight | Scoring Logic |
|-------|------------------|---------------|
| Hold Code Validation | High/Medium/Low | High if COBOC/COBHD valid, no duplicates |
| Eligibility | High/Medium/Low | High if coverage verified + EOB matched |
| Timely Filing | High/Medium/Low | High if well within limit, Medium if close |
| Coordination | High/Medium/Low | High if clear PR codes, Medium if ambiguous |
| COB Calculation | High/Medium/Low | High if amounts reconcile |
| Posting | High/Medium/Low | High if no exceptions |
| Post Validation | High/Medium/Low | High if all 6 checks pass |

**Overall Confidence** = Average of all stage confidence scores mapped to 0-100%:
- High = 95%, Medium = 75%, Low = 50%

---

## 4. Finalization & Posting — How the Solution Completes the Claim

### 4.1 Posting to Core Claims Application

After determination, the solution posts back to the originating core claims platform:

```
┌─────────────────────────────────────────────────────────────┐
│              CORE APPLICATION WRITEBACK                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Detail Screen Updates:                                     │
│  ├── Allowed Amount      → Calculated secondary payment     │
│  ├── Non-Covered Amount  → Amount not covered per COB rules │
│  ├── Allowed Reason      → "COB Secondary Calculation"      │
│  └── Payment Amount      → Net payable to provider          │
│                                                             │
│  Alt + WD Screen Updates:                                   │
│  ├── Denial Codes        → DN017, DN018, DNEOB, DNNPR, etc.│
│  ├── Denial Reasons      → Human-readable descriptions      │
│  └── Adjustment Codes    → CO-45, PR-1, PR-2, PR-3, etc.   │
│                                                             │
│  Coordination Adjustments:                                  │
│  ├── DN001 Removal       → Remove initial pend denial       │
│  ├── Hold Code Release   → Release COBOC/COBHD/COBPR       │
│  ├── Auth Number Update  → Link authorization if applicable │
│  └── Status Update       → Finalized / Denied / Pended     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Posting to BPM Application

Simultaneously, the solution updates the BPM (Business Process Management) system:

```
┌─────────────────────────────────────────────────────────────┐
│              BPM APPLICATION UPDATE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Case Status Update:                                        │
│  ├── Case ID            → COB-CASE-{claim_number}           │
│  ├── Status             → RESOLVED / DENIED / HITL_PENDING  │
│  ├── Resolution Type    → AUTO_RESOLVED / EXAMINER_APPROVED │
│  ├── Confidence Score   → 92% (or actual score)             │
│  └── Processing Time    → Total pipeline execution time     │
│                                                             │
│  Audit Trail:                                               │
│  ├── Agent Execution Log → Which agents ran, outcomes       │
│  ├── Data Sources Used   → Systems queried during analysis  │
│  ├── Decision Reasoning  → AI reasoning per stage           │
│  └── Examiner Decision   → If HITL: who, when, why         │
│                                                             │
│  Workflow Routing:                                           │
│  ├── Auto-Resolved      → Close case, archive              │
│  ├── HITL Required      → Route to examiner queue           │
│  ├── Re-Pend Required   → Route back to pend queue         │
│  └── Escalation         → Route to senior reviewer          │
│                                                             │
│  Metrics & SLA:                                             │
│  ├── Touch Time         → Time from pend to resolution      │
│  ├── Auto-Resolve Rate  → % resolved without human touch    │
│  ├── HITL Turnaround    → Time from queue to decision       │
│  └── Accuracy Rate      → Post-audit accuracy tracking      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 HITL (Human-in-the-Loop) Flow

When confidence is below the auto-resolve threshold:

```
CLAIM ROUTED TO HITL
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ EXAMINER WORKBENCH                                          │
│                                                             │
│ Examiner sees:                                              │
│ ├── Full 8-stage AI analysis (pre-computed)                 │
│ ├── All data sources used                                   │
│ ├── AI recommendation with confidence                       │
│ ├── Critical flags and risk indicators                      │
│ └── Financial calculations with formulas                    │
│                                                             │
│ Examiner decides:                                           │
│ ├── ✓ Approve & Release → Posts payment to core system      │
│ ├── ✗ Deny with Reason  → Posts denial codes to core system │
│ └── ↩ Manual Processing → Routes to manual adjudication     │
│                                                             │
│ Decision recorded:                                          │
│ ├── Examiner name                                           │
│ ├── Timestamp                                               │
│ ├── Action taken                                            │
│ ├── Reason code (if deny)                                   │
│ └── Notes/rationale                                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    POSTING (same as auto-resolve)
                    → Core Application + BPM Update
```

---

## 5. Complete End-to-End Sequence

```
TIME →
─────────────────────────────────────────────────────────────────────────────

T+0s    PEND EVENT received from Xcelys (PND-007 COB)
        │
T+0.1s  Orchestrator creates case, reads claim from DB
        │
T+0.2s  Stage 1: Intake Adapter normalizes schema
        │
T+0.5s  Stage 2: Hold Code Agent validates COBOC → "Continue"
        │
T+1.5s  Stage 3: Eligibility Agent queries Member360 + S3 EOB
        │         → "Primary Insurance Verified (Medicare)"
        │
T+2.0s  Stage 4: Timely Filing Agent checks state rules
        │         → "Passed (aged 89 days, limit 365)"
        │
T+3.0s  Stage 5: Coordination Agent interprets PR codes
        │         → "Pay as Secondary (PR-3 detected)"
        │
T+3.5s  Stage 6: COB Calculation Agent computes amounts
        │         → "Net payable: $213.81"
        │
T+4.0s  Stage 7: Posting Agent generates instructions
        │         → "Ready for Posting"
        │
T+4.5s  Stage 8: Post Validation Agent runs 6 checks
        │         → "Claim Ready for Finalization"
        │
T+5.0s  Orchestrator calculates confidence: 95%
        │
        ├── IF ≥ 92%: AUTO-RESOLVE
        │   │
        │   T+5.1s  POST to Core Claims Platform:
        │   │       - Release hold COBOC
        │   │       - Post payment $213.81
        │   │       - Apply adjustment CO-45, PR-3
        │   │       - Status → Finalized
        │   │
        │   T+5.2s  POST to BPM Application:
        │   │       - Case status → RESOLVED
        │   │       - Resolution type → AUTO_RESOLVED
        │   │       - Confidence → 95%
        │   │       - Close case
        │   │
        │   T+5.3s  AUDIT LOG entry created
        │           - Action: claims_process
        │           - Confidence: 95
        │           - Status: Approved
        │
        └── IF < 92%: ROUTE TO HITL
            │
            T+5.1s  POST to BPM Application:
            │       - Case status → HITL_PENDING
            │       - Route to examiner queue
            │
            T+???   EXAMINER reviews and decides
            │
            T+???   POST to Core Claims Platform + BPM
                    (same as auto-resolve, with examiner attribution)
```

---

## 6. Integration Points Summary

| Integration | Direction | Protocol | Frequency |
|-------------|-----------|----------|-----------|
| Core Claims → Solution | Inbound | API / Event / Batch | Per pend event |
| Solution → Core Claims | Outbound | API writeback | Per resolution |
| Solution → BPM | Outbound | API / Event | Per resolution |
| Solution → Member360 | Query | REST API | Per claim |
| Solution → EDI Gateway | Query | EDI X12 270/271 | Per claim |
| Solution → S3 (EOB docs) | Query | AWS S3 signed URL | Per claim |
| Solution → Bedrock | Query | AWS Bedrock API | Per agent call |
| Solution → PostgreSQL | Read/Write | psycopg2 | Continuous |
| BPM → Solution (HITL) | Inbound | Webhook / API | Per examiner decision |

---

## 7. Error Handling & Resilience

| Scenario | Handling |
|----------|----------|
| Bedrock unavailable | Deterministic fallback logic runs (rules engine) |
| Core system timeout | Retry 3x with exponential backoff, then route to HITL |
| EOB not found in S3 | Deny as DNEOB, route to HITL for manual EOB retrieval |
| Invalid hold code | Flag as "Human Review Required", route to HITL |
| Financial mismatch | Post Validation catches it, routes to Re-Pend |
| Duplicate claim | Stage 2 detects EXDUC, routes to Duplicate Review queue |

---

## 8. Security & Compliance

| Control | Implementation |
|---------|---------------|
| Authentication | JWT tokens (7-day expiry) |
| Authorization | Role-based (Admin/Examiner/Viewer) |
| Audit Trail | Every action logged with user, timestamp, entity |
| Data at Rest | PostgreSQL on RDS with encryption |
| Data in Transit | HTTPS/TLS for all API calls |
| PHI Protection | No PHI in logs, signed URLs for documents |
| HIPAA Compliance | Audit logging, access controls, encryption |

---

## 9. Metrics & Monitoring

| Metric | Source | Target |
|--------|--------|--------|
| Auto-Resolve Rate | agent_results table | ≥ 70% of COB pends |
| Average Processing Time | agent_stage_outputs timestamps | < 15 seconds per claim |
| HITL Turnaround | examiner_decisions.decided_at - claims.updated_at | < 4 hours |
| Accuracy Rate | Post-audit sampling | ≥ 98% |
| Agent Success Rate | agent_registry.success_rate | ≥ 97% per agent |
| System Uptime | Health check endpoint | 99.9% |
