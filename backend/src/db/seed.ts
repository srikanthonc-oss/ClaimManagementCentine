import { pool } from './pool'
import bcrypt from 'bcryptjs'

async function seed() {
  const client = await pool.connect()
  try {
    // Create default admin
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await client.query(`
      INSERT INTO users (email, name, password, role, platforms, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@nttdata.com', 'Admin', hashedPassword, 'admin', JSON.stringify(['Facet', 'Amisys', 'Xcelys']), true])

    // Create default routing thresholds
    await client.query(`
      INSERT INTO routing_thresholds (id, auto_resolve, hitl_low)
      VALUES ('global', 92, 60)
      ON CONFLICT (id) DO NOTHING
    `)

    console.log('✓ Seed completed: admin user and default thresholds created')
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
