import { Router } from 'express'
import { pool } from '../db/pool'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    let result = await pool.query("SELECT * FROM routing_thresholds WHERE id = 'global'")
    if (result.rows.length === 0) {
      await pool.query("INSERT INTO routing_thresholds (id, auto_resolve, hitl_low) VALUES ('global', 92, 60)")
      result = await pool.query("SELECT * FROM routing_thresholds WHERE id = 'global'")
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch thresholds' })
  }
})

router.put('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { autoResolve, hitlLow } = req.body
    const result = await pool.query(
      "UPDATE routing_thresholds SET auto_resolve=$1, hitl_low=$2, updated_at=NOW() WHERE id='global' RETURNING *",
      [autoResolve, hitlLow]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to update thresholds' })
  }
})

export { router as thresholdsRoutes }
