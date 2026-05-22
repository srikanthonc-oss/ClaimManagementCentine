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
            adj_grp_code VARCHAR(50),
            reason_code VARCHAR(50),
            pr_amount DECIMAL(12,2) DEFAULT 0,
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
            output_data JSONB NOT NULL,
            outcome VARCHAR(100),
            confidence VARCHAR(20),
            reasoning TEXT,
            executed_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(claim_id, stage_number)
        );
    """)
    conn.commit()
    cur.close()
    conn.close()
    print("DB tables initialized")
