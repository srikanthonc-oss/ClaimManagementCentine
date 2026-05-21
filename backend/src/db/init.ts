import { pool } from './pool'

/**
 * Initialize PostgreSQL tables
 */
async function initDB() {
  const client = await pool.connect()
  try {
    await client.query(`
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
    `)

    console.log('✓ All tables created successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

initDB()
