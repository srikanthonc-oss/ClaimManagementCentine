import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/dashboard/metrics
router.get('/metrics', authenticate, async (req: AuthRequest, res) => {
  try {
    const where: any = {}
    if (req.user?.role !== 'admin') {
      where.platform = { in: req.user?.platforms || [] }
    }

    const [total, approved, denied, inReview, pending] = await Promise.all([
      prisma.claim.count({ where }),
      prisma.claim.count({ where: { ...where, status: 'Approved' } }),
      prisma.claim.count({ where: { ...where, status: 'Denied' } }),
      prisma.claim.count({ where: { ...where, status: 'InReview' } }),
      prisma.claim.count({ where: { ...where, status: 'Pending' } }),
    ])

    const billedSum = await prisma.claim.aggregate({ where, _sum: { billedAmount: true } })
    const avgConfidence = await prisma.claim.aggregate({ where, _avg: { confidence: true } })
    const examinerDecisions = await prisma.examinerDecision.count()

    res.json({
      total,
      approved,
      denied,
      inReview,
      pending,
      totalBilled: billedSum._sum.billedAmount || 0,
      avgConfidence: Math.round(avgConfidence._avg.confidence || 0),
      examinerDecisions,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' })
  }
})

export { router as dashboardRoutes }
