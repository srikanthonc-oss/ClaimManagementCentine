import { Router } from 'express'
import { pool } from '../db/pool'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM data_sources ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data sources' })
  }
})

router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { name, type, config, status } = req.body
    const result = await pool.query(
      `INSERT INTO data_sources (name, type, config, status) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, type, JSON.stringify(config || {}), status || 'active']
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to create data source' })
  }
})

router.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { name, type, config, status } = req.body
    const result = await pool.query(
      `UPDATE data_sources SET name=COALESCE($1,name), type=COALESCE($2,type), config=COALESCE($3,config), status=COALESCE($4,status), updated_at=NOW() WHERE id=$5 RETURNING *`,
      [name, type, config ? JSON.stringify(config) : null, status, req.params.id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to update data source' })
  }
})

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM data_sources WHERE id = $1', [req.params.id])
    res.json({ message: 'Data source deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete data source' })
  }
})

export { router as dataSourcesRoutes }
