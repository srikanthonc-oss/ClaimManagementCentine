import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/data-sources
router.get('/', authenticate, async (req, res) => {
  try {
    const dataSources = await prisma.dataSource.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(dataSources)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data sources' })
  }
})

// POST /api/data-sources
router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { name, type, config, status } = req.body
    const dataSource = await prisma.dataSource.create({
      data: { name, type, config, status: status || 'active' },
    })
    res.status(201).json(dataSource)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create data source' })
  }
})

// PUT /api/data-sources/:id
router.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const dataSource = await prisma.dataSource.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(dataSource)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update data source' })
  }
})

// DELETE /api/data-sources/:id
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await prisma.dataSource.delete({ where: { id: req.params.id } })
    res.json({ message: 'Data source deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete data source' })
  }
})

export { router as dataSourcesRoutes }
