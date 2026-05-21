import { Router } from 'express'
import { pool } from '../db/pool'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/metrics', authenticate, async (req: AuthRequest, res) => {
  try {
    let platformFilter = ''
    const params: any[] = []

    if (req.user?.role !== 'admin' && req.user?.platforms?.length) {
      platformFilter = 'WHERE platform = ANY($1)'
      params.push(req.user.platforms)
    }

    const metrics = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Approved') as approved,
        COUNT(*) FILTER (WHERE status = 'Denied') as denied,
        COUNT(*) FILTER (WHERE status = 'InReview') as in_review,
        COUNT(*) FILTER (WHERE status = 'Pending') as pending,
        COALESCE(SUM(billed_amount), 0) as total_billed,
        COALESCE(AVG(confidence), 0) as avg_confidence
      FROM claims ${platformFilter}
    `, params)

    const decisions = await pool.query('SELECT COUNT(*) FROM examiner_decisions')

    const row = metrics.rows[0]
    res.json({
      total: parseInt(row.total),
      approved: parseInt(row.approved),
      denied: parseInt(row.denied),
      inReview: parseInt(row.in_review),
      pending: parseInt(row.pending),
      totalBilled: parseFloat(row.total_billed),
      avgConfidence: Math.round(parseFloat(row.avg_confidence)),
      examinerDecisions: parseInt(decisions.rows[0].count),
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: 'Failed to fetch metrics' })
  }
})

export { router as dashboardRoutes }
