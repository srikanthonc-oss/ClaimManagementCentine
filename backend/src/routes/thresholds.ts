import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/thresholds
router.get('/', authenticate, async (req, res) => {
  try {
    let threshold = await prisma.routingThreshold.findUnique({ where: { id: 'global' } })
    if (!threshold) {
      threshold = await prisma.routingThreshold.create({
        data: { id: 'global', autoResolve: 92, hitlLow: 60 },
      })
    }
    res.json(threshold)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch thresholds' })
  }
})

// PUT /api/thresholds
router.put('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { autoResolve, hitlLow } = req.body
    const threshold = await prisma.routingThreshold.upsert({
      where: { id: 'global' },
      create: { id: 'global', autoResolve, hitlLow },
      update: { autoResolve, hitlLow },
    })
    res.json(threshold)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update thresholds' })
  }
})

export { router as thresholdsRoutes }
