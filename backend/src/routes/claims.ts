import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/claims — List claims with filters
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { platform, classification, status, page = '1', pageSize = '50' } = req.query

    const where: any = {}

    // Platform access restriction
    if (req.user?.role !== 'admin') {
      where.platform = { in: req.user?.platforms || [] }
    }

    if (platform) where.platform = platform
    if (classification) where.classification = classification
    if (status) where.status = status

    const total = await prisma.claim.count({ where })
    const claims = await prisma.claim.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
      include: { agentResult: true, examinerDecision: true },
    })

    res.json({ claims, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims' })
  }
})

// GET /api/claims/:id — Get single claim with full details
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: { agentResult: true, examinerDecision: { include: { user: true } } },
    })

    if (!claim) return res.status(404).json({ error: 'Claim not found' })

    res.json(claim)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claim' })
  }
})

// POST /api/claims/upload — Upload and parse claims file
router.post('/upload', authenticate, requireRole('admin', 'examiner'), async (req: AuthRequest, res) => {
  try {
    const { claims, fileName, platform } = req.body

    if (!claims || !Array.isArray(claims) || !platform) {
      return res.status(400).json({ error: 'Claims array and platform are required' })
    }

    // Create upload record
    const upload = await prisma.uploadHistory.create({
      data: {
        fileName: fileName || 'unknown.xlsx',
        platform,
        claimsCount: claims.length,
        userId: req.user!.id,
      },
    })

    // Insert claims
    const created = await prisma.claim.createMany({
      data: claims.map((c: any) => ({
        claimNumber: c.claimNumber,
        classification: c.classification,
        platform,
        providerName: c.providerName,
        billedAmount: c.billedAmount,
        allowedAmount: c.allowedAmount || null,
        status: 'Pending',
        confidence: 0,
        daysAged: c.daysAged,
        state: c.state,
        holdCode: c.holdCode || null,
        submitType: c.submitType || null,
        claimType: c.claimType || null,
        providerSpecialty: c.providerSpecialty || null,
        subscriberId: c.subscriberId || null,
        parFlag: c.parFlag || null,
        form: c.form || null,
        recvDt: c.recvDt || null,
        rawData: c,
        uploadId: upload.id,
      })),
      skipDuplicates: true,
    })

    res.status(201).json({ upload, claimsCreated: created.count })
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload claims' })
  }
})

// POST /api/claims/:id/process — Process a single claim (run agents)
router.post('/:id/process', authenticate, requireRole('admin', 'examiner'), async (req: AuthRequest, res) => {
  try {
    const claim = await prisma.claim.findUnique({ where: { id: req.params.id } })
    if (!claim) return res.status(404).json({ error: 'Claim not found' })

    // TODO: Replace with actual Bedrock agent calls
    const agentResultData = req.body.agentResult

    const agentResult = await prisma.agentResult.upsert({
      where: { claimId: claim.id },
      create: {
        claimId: claim.id,
        resultData: agentResultData,
        confidence: agentResultData.confidenceBreakdown,
        recommendation: agentResultData.recommendation,
        reasoningSummary: agentResultData.reasoningSummary,
      },
      update: {
        resultData: agentResultData,
        confidence: agentResultData.confidenceBreakdown,
        recommendation: agentResultData.recommendation,
        reasoningSummary: agentResultData.reasoningSummary,
      },
    })

    // Get threshold
    const threshold = await prisma.routingThreshold.findUnique({ where: { id: 'global' } })
    const autoResolveThreshold = threshold?.autoResolve || 92

    // Update claim status based on confidence
    const overall = agentResultData.confidenceBreakdown.overall
    const newStatus = overall >= autoResolveThreshold ? 'Approved' : 'InReview'

    await prisma.claim.update({
      where: { id: claim.id },
      data: { status: newStatus, confidence: overall },
    })

    res.json({ agentResult, status: newStatus })
  } catch (error) {
    res.status(500).json({ error: 'Failed to process claim' })
  }
})

// POST /api/claims/:id/decide — Examiner decision
router.post('/:id/decide', authenticate, requireRole('admin', 'examiner'), async (req: AuthRequest, res) => {
  try {
    const { action, reason, notes } = req.body
    const claim = await prisma.claim.findUnique({ where: { id: req.params.id } })
    if (!claim) return res.status(404).json({ error: 'Claim not found' })

    // Save decision
    const decision = await prisma.examinerDecision.upsert({
      where: { claimId: claim.id },
      create: {
        claimId: claim.id,
        userId: req.user!.id,
        action,
        reason: reason || null,
        notes,
      },
      update: {
        userId: req.user!.id,
        action,
        reason: reason || null,
        notes,
        decidedAt: new Date(),
      },
    })

    // Update claim status
    let newStatus: string
    let newConfidence = claim.confidence
    if (action === 'approve') {
      newStatus = 'Approved'
      newConfidence = 100
    } else if (action === 'deny') {
      newStatus = 'Denied'
    } else {
      newStatus = 'Pending' // manual-review
    }

    await prisma.claim.update({
      where: { id: claim.id },
      data: { status: newStatus as any, confidence: newConfidence },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: `claim_${action}`,
        entity: 'claim',
        entityId: claim.id,
        details: { claimNumber: claim.claimNumber, reason, notes },
      },
    })

    res.json({ decision, status: newStatus })
  } catch (error) {
    res.status(500).json({ error: 'Failed to save decision' })
  }
})

// DELETE /api/claims — Clear all claims (admin only)
router.delete('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await prisma.examinerDecision.deleteMany()
    await prisma.agentResult.deleteMany()
    await prisma.claim.deleteMany()
    await prisma.uploadHistory.deleteMany()
    res.json({ message: 'All claims cleared' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear claims' })
  }
})

export { router as claimsRoutes }
