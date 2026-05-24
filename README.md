# Agentic AI Claim Management

AI-powered healthcare claims pend resolution system using multi-agent architecture. Built for Health Plan payer organizations to automate COB (Coordination of Benefits) claim adjudication through 9 specialized AI agents.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│         Frontend (Next.js 14, port 3000)            │
│         React UI / Tailwind CSS / shadcn/ui         │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│         Backend (FastAPI/Uvicorn, port 4000)        │
│         Python / Strands Agents Framework           │
└──────┬───────────────────────────────────┬──────────┘
       │                                   │
┌──────▼──────────┐              ┌─────────▼──────────┐
│  PostgreSQL     │              │  AWS Bedrock       │
│  (AWS RDS)      │              │  Claude Sonnet 4   │
│  22 tables      │              │  (us-east-1)       │
└─────────────────┘              └────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| Database | PostgreSQL (AWS RDS), psycopg2 |
| AI/ML | AWS Bedrock (Claude Sonnet 4), Strands Agents Framework |
| Auth | JWT (python-jose), bcrypt |
| File Processing | openpyxl (Excel parsing) |

## Key Features

1. **Claims File Intake** — Upload XLS claims inventory + reference data (hold codes, EOBs, COB history)
2. **Claim Execution Workbench** — Run 8-stage AI agent pipeline per claim, view detailed results
3. **COB Pipeline Visualization** — Visual 8-step resolution flow with AI Reasoning, Traditional Automation, and HITL sections
4. **Agent Registry** — 9 AI agents with enable/disable toggle, model info, latency, and success rate stats
5. **Dashboard** — Real-time metrics (pended claims, auto-resolved %, HITL queue, value at risk)
6. **Role-Based Access** — Admin, Examiner, Viewer roles with platform-level permissions
7. **Audit Logging** — All actions tracked in `audit_log` table with user, entity, and timestamp

## 8-Stage Agent Pipeline

| Stage | Agent | Purpose |
|-------|-------|---------|
| 1 | Intake Adapter | AI Extracted Data Summary — schema normalization from XLS/EDI/PAPER |
| 2 | Hold Code Validation | Hold and Denial Code Validation (COBOC/COBHD, History check, EXDUC) |
| 3 | Eligibility Agent | Member Eligibility (COB history, EOB match, DN017/DN018/DNEOB) |
| 4 | Timely Filing | Timely Filing Validation (state-specific rules, 365-day limit, CMS 42 CFR 424.44) |
| 5 | Coordination Rule | Coordination Rule Determination (PR 96/204=primary, PR 1/2/3=secondary, CO 45=deny) |
| 6 | COB Calculation | COB Calculation (3-condition formula, net payable) |
| 7 | Posting | Posting (system update recommendations, adjustment codes, hold release) |
| 8 | Post Validation | Post Validation (6-point compliance check, duplicate detection) |

Additionally, the **Resolution Orchestrator** coordinates all agents and determines the final recommendation (auto-resolve vs HITL).

## Database Schema (22 Tables)

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles and platform assignments |
| `claims` | Claims inventory (claim number, amounts, status, confidence) |
| `upload_history` | File upload tracking |
| `examiner_decisions` | Human examiner approve/deny/manual decisions |
| `data_sources` | Configured data source connections |
| `routing_thresholds` | Auto-resolve and HITL threshold configuration |
| `audit_log` | Full audit trail of all system actions |

### Agent Reference Data (populated from uploaded XLS)
| Table | Purpose |
|-------|---------|
| `claim_hold_codes` | Hold/denial codes per claim line |
| `claim_detail_lines` | CPT codes, amounts, dates per line |
| `claim_cob_history` | COB/insurance history per member |
| `claim_eob_extraction` | EOB data (paid amounts, adjustment codes) |
| `claim_denial_details` | Denial reason codes per line |
| `claim_header_detail` | Member ID, specialty, PAR status, received date |

### Agent Output
| Table | Purpose |
|-------|---------|
| `agent_results` | Final aggregated result per claim (confidence, recommendation) |
| `agent_stage_outputs` | Individual stage results (input, output, reasoning per stage) |
| `agent_registry` | Agent configuration (enabled/disabled, model type, stats) |

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (AWS RDS or local)
- AWS account with Bedrock access (Claude Sonnet 4 enabled in us-east-1)

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database and AWS credentials

# Initialize database tables
python -c "from app.db.pool import init_db; init_db()"

# Seed default admin user and thresholds
python seed.py

# Start the server (port 4000)
python run.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:4000

# Start development server (port 3000)
npm run dev
```

### Verify Setup

```bash
# Health check
curl http://localhost:4000/api/health

# Expected: {"status":"ok","db":"connected","timestamp":"..."}
```

## Environment Variables

### Backend (`backend/.env`)

```env
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# PostgreSQL (RDS)
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=sqladmin
DB_PASSWORD=your-password
DB_NAME=cob_poc_store
PG_PORT=5432

# AWS Services
S3_BUCKET=your-s3-bucket
BEDROCK_SONNET_MODEL=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_HAIKU_MODEL=anthropic.claude-3-haiku-20240307-v1:0
HITL_TABLE=your-dynamodb-table
COB_KNOWLEDGE_BASE_ID=your-kb-id

# Server
PORT=4000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
MOCK_MODE=false
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/sign-in` | User login (returns JWT) | No |
| POST | `/api/auth/sign-up` | User registration | No |

### Claims
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/claims` | List claims (paginated, filterable) | User |
| GET | `/api/claims/uploads` | Upload history | User |
| GET | `/api/claims/{id}` | Get claim detail + agent result + decision | User |
| POST | `/api/claims/upload` | Upload claims from XLS | Admin/Examiner |
| POST | `/api/claims/upload-reference` | Upload reference data (hold codes, EOBs, etc.) | Admin/Examiner |
| POST | `/api/claims/{id}/run-agents` | Run 8-stage agent pipeline | Admin/Examiner |
| GET | `/api/claims/{id}/agent-output` | Get full agent pipeline output (all stages) | User |
| POST | `/api/claims/{id}/process` | Store agent processing result | Admin/Examiner |
| POST | `/api/claims/{id}/decide` | Examiner decision (approve/deny/manual) | Admin/Examiner |
| DELETE | `/api/claims` | Clear all claims data | Admin |

### Agents
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/agents` | List all agents with status | User |
| PUT | `/api/agents/{id}/toggle` | Enable/disable an agent | Admin |

### Data Sources
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/data-sources` | List configured data sources | User |
| POST | `/api/data-sources` | Create data source | Admin |
| PUT | `/api/data-sources/{id}` | Update data source | Admin |
| DELETE | `/api/data-sources/{id}` | Delete data source | Admin |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users | Admin |
| POST | `/api/users` | Create user | Admin |
| PUT | `/api/users/{id}` | Update user (role, platforms, active) | Admin |
| DELETE | `/api/users/{id}` | Delete user | Admin |

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/metrics` | Aggregated metrics (totals, avg confidence) | User |

### Thresholds
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/thresholds` | Get routing thresholds | User |
| PUT | `/api/thresholds` | Update thresholds | Admin |

### System
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check (DB connectivity) | No |

## Project Structure

```
Agentic-Claim-Operation-Demo/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── base_agent.py           # Base agent class
│   │   │   ├── orchestrator.py         # Resolution orchestrator (runs all stages)
│   │   │   ├── hold_code_agent.py      # Stage 2: Hold code validation
│   │   │   ├── eligibility_agent.py    # Stage 3: Member eligibility
│   │   │   ├── timely_filing_agent.py  # Stage 4: Timely filing rules
│   │   │   ├── coordination_agent.py   # Stage 5: Coordination determination
│   │   │   ├── cob_calculation_agent.py# Stage 6: COB calculation
│   │   │   ├── posting_agent.py        # Stage 7: Posting recommendations
│   │   │   ├── post_validation_agent.py# Stage 8: Post validation
│   │   │   └── resolution_agent.py     # Final resolution logic
│   │   ├── db/
│   │   │   └── pool.py                 # DB connection + table initialization
│   │   ├── routes/
│   │   │   ├── auth.py                 # Authentication endpoints
│   │   │   ├── claims.py               # Claims CRUD + agent execution
│   │   │   ├── agents.py               # Agent registry management
│   │   │   ├── data_sources.py         # Data source configuration
│   │   │   ├── users.py                # User management
│   │   │   ├── dashboard.py            # Dashboard metrics
│   │   │   └── thresholds.py           # Routing threshold config
│   │   ├── services/
│   │   │   ├── audit.py                # Audit logging service
│   │   │   └── auth_middleware.py       # JWT validation + role guards
│   │   └── main.py                     # FastAPI app entry point
│   ├── .env.example                    # Environment template
│   ├── requirements.txt                # Python dependencies
│   ├── run.py                          # Server startup script
│   ├── seed.py                         # Database seeder (admin user)
│   ├── seed_reference_data.py          # Reference data seeder
│   └── reset_db.py                     # Database reset utility
├── frontend/
│   ├── app/
│   │   ├── sign-in/                    # Login page
│   │   ├── sign-up/                    # Registration page
│   │   ├── dashboard/                  # Metrics dashboard
│   │   ├── file-intake/                # Claims + reference data upload
│   │   ├── pend-processing/            # Claim execution workbench
│   │   ├── cob/                        # COB pipeline visualization
│   │   ├── ai-functions/               # Agent registry UI
│   │   ├── data-sources/               # Data source management
│   │   ├── data-ontology/              # Data ontology viewer
│   │   ├── routing-thresholds/         # Threshold configuration
│   │   ├── user-management/            # User admin
│   │   ├── help/                       # Help/documentation
│   │   ├── api/                        # Next.js API routes (proxy)
│   │   ├── layout.tsx                  # Root layout with sidebar
│   │   └── page.tsx                    # Home/redirect
│   ├── .env.local                      # Frontend environment
│   ├── package.json                    # Node dependencies
│   └── next.config.js                  # Next.js configuration
└── README.md                           # This file
```

## Default Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@nttdata.com | admin123 | Admin |

## License

Proprietary — NTT DATA internal use only.
