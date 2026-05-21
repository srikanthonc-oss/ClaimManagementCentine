import { Router } from 'express'
import { pool } from '../db/pool'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'
import { putAgentState } from '../services/dynamodb'

const router = Router()

// GET /api/claims
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { platform, classification, status, page = '1', pageSize = '50' } = req.query
    const conditions: string[] = []
    const params: any[] = []
    let paramIdx = 1

    // Platform access restriction
    if (req.user?.role !== 'admin' && req.user?.platforms?.length) {
      conditions.push(`platform = ANY($${paramIdx})`)
      params.push(req.user.platforms)
      paramIdx++
    }

    if (platform) { conditions.push(`platform = $${paramIdx}`); params.push(platform); paramIdx++ }
    if (classification) { conditions.push(`classification = $${paramIdx}`); params.push(classification); paramIdx++ }
    if (status) { conditions.push(`status = $${paramIdx}`); params.push(status); paramIdx++ }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (Number(page) - 1) * Number(pageSize)

    const countResult = await pool.query(`SELECT COUNT(*) FROM claims ${where}`, params)
    const total = parseInt(countResult.rows[0].count)

    const claimsResult = await pool.query(
      `SELECT * FROM claims ${where} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, Number(pageSize), offset]
    )

    res.json({ claims: claimsResult.rows, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (error) {
    console.error('Fetch claims error:', error)
    res.status(500).json({ error: 'Failed to fetch claims' })
  }
})

// GET /api/claims/:id
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const claim = await pool.query('SELECT * FROM claims WHERE id = $1', [req.params.id])
    if (claim.rows.length === 0) return res.status(404).json({ error: 'Claim not found' })

    const agentResult = await pool.query('SELECT * FROM agent_results WHERE claim_id = $1', [req.params.id])
    const decision = await pool.query(
      `SELECT ed.*, u.name as decided_by_name FROM examiner_decisions ed LEFT JOIN users u ON ed.user_id = u.id WHERE ed.claim_id = $1`,
      [req.params.id]
    )

    res.json({
      ...claim.rows[0],
      agentResult: agentResult.rows[0] || null,
      examinerDecision: decision.rows[0] || null,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claim' })
  }
})

// POST /api/claims/upload
router.post('/upload', authenticate, requireRole('admin', 'examiner'), async (req: AuthRequest, res) => {
  try {
    const { claims, fileName, platform } = req.body
    if (!claims || !Array.isArray(claims) || !platform) {
      return res.status(400).json({ error: 'Claims array and platform are required' })
    }

    // Create upload record
    const upload = await pool.query(
      `INSERT INTO upload_history (file_name, platform, claims_count, user_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [fileName || 'unknown.xlsx', platform, claims.length, req.user!.id]
    )

    // Insert claims
    let inserted = 0
    for (const c of claims) {
      try {
        await pool.query(
          `INSERT INTO claims (claim_number, classification, platform, provider_name, billed_amount, allowed_amount, days_aged, state, hold_code, submit_type, claim_type, provider_specialty, subscriber_id, par_flag, form, recv_dt, raw_data, upload_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
           ON CONFLICT (claim_number) DO NOTHING`,
          [c.claimNumber, c.classification, platform, c.providerName, c.billedAmount, c.allowedAmount || null, c.daysAged, c.state, c.holdCode || null, c.submitType || null, c.claimType || null, c.providerSpecialty || null, c.subscriberId || null, c.parFlag || null, c.form || null, c.recvDt || null, JSON.stringify(c), upload.rows[0].id]
        )
        inserted++
      } catch (e) { /* skip duplicates */ }
    }

    res.status(201).json({ upload: upload.rows[0], claimsCreated: inserted })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload claims' })
  }
})

// POST /api/claims/:id/process
router.post('/:id/process', authenticate, requireRole('admin', 'examiner'), async (req: AuthRequest, res) => {
  try {
    const claim = await pool.query('SELECT * FROM claims WHERE id = $1', [req.params.id])
    if (claim.rows.length === 0) return res.status(404).json({ error: 'Claim not found' })

    const claimData = claim.rows[0]
    const agentResultData = req.body.agentResult

    // Store in PostgreSQL
    await pool.query(
      `INSERT INTO agent_results (claim_id, claim_number, result_data, confidence, recommendation, reasoning_summary)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (claim_id) DO UPDATE SET result_data=$3, confidence=$4, recommendation=$5, reasoning_summary=$6, processed_at=NOW()`,
      [claimData.id, claimData.claim_number, JSON.stringify(agentResultData), JSON.stringify(agentResultData.confidenceBreakdown), agentResultData.recommendation, agentResultData.reasoningSummary]
    )

    // Store agent state in DynamoDB
    await putAgentState(claimData.claim_number, 'ResolutionAgent', agentResultData)

    // Get threshold and update claim status
    const threshold = await pool.query("SELECT auto_resolve FROM routing_thresholds WHERE id = 'global'")
    const autoResolveThreshold = threshold.rows[0]?.auto_resolve || 92
    const overall = agentResultData.confidenceBreakdown.overall
    const newStatus = overall >= autoResolveThreshold ? 'Approved' : 'InReview'

    await pool.query('UPDATE claims SET status=$1, confidence=$2, updated_at=NOW() WHERE id=$3', [newStatus, overall, claimData.id])

    res.json({ status: newStatus, confidence: overall })
  } catch (error) {
    console.error('Process error:', error)
    res.status(500).json({ error: 'Failed to process claim' })
  }
})

// POST /api/claims/:id/decide
router.post('/:id/decide', authenticate, requireRole('admin', 'examiner'), async (req: AuthRequest, res) => {
  try {
    const { action, reason, notes } = req.body
    const claim = await pool.query('SELECT * FROM claims WHERE id = $1', [req.params.id])
    if (claim.rows.length === 0) return res.status(404).json({ error: 'Claim not found' })

    // Save decision
    await pool.query(
      `INSERT INTO examiner_decisions (claim_id, user_id, action, reason, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (claim_id) DO UPDATE SET user_id=$2, action=$3, reason=$4, notes=$5, decided_at=NOW()`,
      [req.params.id, req.user!.id, action, reason || null, notes]
    )

    // Update claim status
    let newStatus = 'Pending'
    let newConfidence = claim.rows[0].confidence
    if (action === 'approve') { newStatus = 'Approved'; newConfidence = 100 }
    else if (action === 'deny') { newStatus = 'Denied' }

    await pool.query('UPDATE claims SET status=$1, confidence=$2, updated_at=NOW() WHERE id=$3', [newStatus, newConfidence, req.params.id])

    // Audit log
    await pool.query(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user!.id, `claim_${action}`, 'claim', req.params.id, JSON.stringify({ claimNumber: claim.rows[0].claim_number, reason, notes })]
    )

    res.json({ status: newStatus, action })
  } catch (error) {
    console.error('Decision error:', error)
    res.status(500).json({ error: 'Failed to save decision' })
  }
})

// DELETE /api/claims
router.delete('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM examiner_decisions')
    await pool.query('DELETE FROM agent_results')
    await pool.query('DELETE FROM claims')
    await pool.query('DELETE FROM upload_history')
    res.json({ message: 'All claims cleared' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear claims' })
  }
})

export { router as claimsRoutes }
