import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()


def get_db():
    """Get a new database connection."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("PG_PORT", "5432")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        sslmode="require"
    )


def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'viewer',
            platforms JSONB DEFAULT '[]',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS upload_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            file_name VARCHAR(255) NOT NULL,
            platform VARCHAR(50) NOT NULL,
            claims_count INT DEFAULT 0,
            duplicates_skipped INT DEFAULT 0,
            user_id UUID REFERENCES users(id),
            uploaded_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS claims (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            claim_number VARCHAR(50) UNIQUE NOT NULL,
            classification VARCHAR(50) NOT NULL,
            platform VARCHAR(50) NOT NULL,
            provider_name VARCHAR(255) NOT NULL,
            billed_amount DECIMAL(12,2) NOT NULL,
            allowed_amount DECIMAL(12,2),
            status VARCHAR(20) DEFAULT 'Pending',
            confidence INT DEFAULT 0,
            days_aged INT DEFAULT 0,
            state VARCHAR(10),
            hold_code VARCHAR(255),
            submit_type VARCHAR(50),
            claim_type VARCHAR(50),
            provider_specialty VARCHAR(100),
            subscriber_id VARCHAR(100),
            par_flag VARCHAR(10),
            form VARCHAR(50),
            recv_dt VARCHAR(50),
            raw_data JSONB,
            upload_id UUID REFERENCES upload_history(id),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS agent_results (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            claim_id UUID UNIQUE REFERENCES claims(id) ON DELETE CASCADE,
            claim_number VARCHAR(50) NOT NULL,
            result_data JSONB NOT NULL,
            confidence JSONB,
            recommendation VARCHAR(50),
            reasoning_summary TEXT,
            processed_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS examiner_decisions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            claim_id UUID UNIQUE REFERENCES claims(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id),
            action VARCHAR(50) NOT NULL,
            reason VARCHAR(255),
            notes TEXT,
            decided_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS data_sources (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) UNIQUE NOT NULL,
            type VARCHAR(50) NOT NULL,
            config JSONB DEFAULT '{}',
            status VARCHAR(20) DEFAULT 'active',
            last_sync TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS routing_thresholds (
            id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
            auto_resolve INT DEFAULT 92,
            hitl_low INT DEFAULT 60,
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            action VARCHAR(100) NOT NULL,
            entity VARCHAR(50),
            entity_id VARCHAR(100),
            details JSONB,
            timestamp TIMESTAMP DEFAULT NOW()
        );

        -- Agent-extracted data tables (populated by agents during pend resolution)

        CREATE TABLE IF NOT EXISTS claim_hold_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
            line_no INT NOT NULL,
            hold_code VARCHAR(50),
            history VARCHAR(10),
            reason VARCHAR(50),
            description TEXT,
            extracted_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS claim_detail_lines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
            line_no INT NOT NULL,
            cpt VARCHAR(20) NOT NULL,
            modifier VARCHAR(10),
            start_date VARCHAR(20),
            end_date VARCHAR(20),
            units INT DEFAULT 1,
            billed_amt DECIMAL(12,2) DEFAULT 0,
            allowed_amt DECIMAL(12,2) DEFAULT 0,
            copay DECIMAL(12,2) DEFAULT 0,
            coinsurance DECIMAL(12,2) DEFAULT 0,
            oc_paid DECIMAL(12,2) DEFAULT 0,
            claim_status VARCHAR(10),
            proc_status VARCHAR(10),
            extracted_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS claim_cob_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
            sno INT NOT NULL,
            primary_insurance VARCHAR(100) NOT NULL,
            effective_date VARCHAR(20),
            term_date VARCHAR(20),
            extracted_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS claim_eob_extraction (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
            sno INT DEFAULT 1,
            cpt VARCHAR(20),
            insurance_name VARCHAR(100),
            paid_amt DECIMAL(12,2) DEFAULT 0,
            adj_grp_code JSONB DEFAULT '[]',
            reason_code JSONB DEFAULT '[]',
            pr_amount JSONB DEFAULT '[]',
            image_ref VARCHAR(255),
            extracted_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS claim_denial_details (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
            line_no INT NOT NULL,
            history VARCHAR(10),
            reason_code VARCHAR(50) NOT NULL,
            extracted_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS claim_header_detail (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
            member_id VARCHAR(50),
            specialty VARCHAR(50),
            place_of_service VARCHAR(10),
            par_status VARCHAR(10),
            received_date VARCHAR(50),
            extracted_at TIMESTAMP DEFAULT NOW()
        );

        -- Agent registry (which agents are enabled/disabled)
        CREATE TABLE IF NOT EXISTS agent_registry (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            model VARCHAR(100),
            model_type VARCHAR(20) DEFAULT 'rules',
            stage VARCHAR(10),
            latency VARCHAR(20),
            success_rate VARCHAR(20),
            is_enabled BOOLEAN DEFAULT true,
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Agent stage outputs (individual stage results stored separately)
        CREATE TABLE IF NOT EXISTS agent_stage_outputs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
            stage_number INT NOT NULL,
            stage_name VARCHAR(100) NOT NULL,
            agent_name VARCHAR(100) NOT NULL,
            input_data JSONB,
            prompt_text TEXT,
            output_data JSONB NOT NULL,
            outcome VARCHAR(100),
            confidence VARCHAR(20),
            reasoning TEXT,
            executed_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(claim_id, stage_number)
        );

        -- Ensure prompt_text column exists (for existing tables)
        ALTER TABLE agent_stage_outputs ADD COLUMN IF NOT EXISTS prompt_text TEXT;

        -- Ensure claim_status and proc_status columns exist (for existing tables)
        ALTER TABLE claim_detail_lines ADD COLUMN IF NOT EXISTS claim_status VARCHAR(10);
        ALTER TABLE claim_detail_lines ADD COLUMN IF NOT EXISTS proc_status VARCHAR(10);
    """)
    conn.commit()
    cur.close()

    # Migrate eob columns to JSONB (separate transaction — won't break init if it fails)
    try:
        cur2 = conn.cursor()
        cur2.execute("SELECT data_type FROM information_schema.columns WHERE table_name = 'claim_eob_extraction' AND column_name = 'adj_grp_code'")
        row = cur2.fetchone()
        if row and row[0] != 'jsonb':
            cur2.execute("ALTER TABLE claim_eob_extraction ALTER COLUMN adj_grp_code DROP DEFAULT")
            cur2.execute("ALTER TABLE claim_eob_extraction ALTER COLUMN reason_code DROP DEFAULT")
            cur2.execute("ALTER TABLE claim_eob_extraction ALTER COLUMN pr_amount DROP DEFAULT")
            cur2.execute("ALTER TABLE claim_eob_extraction ALTER COLUMN adj_grp_code TYPE JSONB USING COALESCE(to_jsonb(adj_grp_code), '[]'::jsonb)")
            cur2.execute("ALTER TABLE claim_eob_extraction ALTER COLUMN reason_code TYPE JSONB USING COALESCE(to_jsonb(reason_code), '[]'::jsonb)")
            cur2.execute("ALTER TABLE claim_eob_extraction ALTER COLUMN pr_amount TYPE JSONB USING COALESCE(jsonb_build_array(pr_amount), '[]'::jsonb)")
            cur2.execute("ALTER TABLE claim_eob_extraction ALTER COLUMN adj_grp_code SET DEFAULT '[]'::jsonb")
            cur2.execute("ALTER TABLE claim_eob_extraction ALTER COLUMN reason_code SET DEFAULT '[]'::jsonb")
            cur2.execute("ALTER TABLE claim_eob_extraction ALTER COLUMN pr_amount SET DEFAULT '[]'::jsonb")
            conn.commit()
            print("EOB columns migrated to JSONB")
        cur2.close()
    except Exception as e:
        conn.rollback()
        print(f"EOB column migration skipped: {e}")

    conn.close()
    print("DB tables initialized")
