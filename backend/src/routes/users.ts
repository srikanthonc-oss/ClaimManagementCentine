import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/users — List all users (admin only)
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, platforms: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// POST /api/users — Create user (admin only)
router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { email, name, password, role, platforms } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), name, password: hashedPassword, role, platforms: platforms || [] },
    })
    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role, platforms: user.platforms })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// PUT /api/users/:id — Update user (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { name, role, platforms, isActive, password } = req.body
    const data: any = {}
    if (name) data.name = name
    if (role) data.role = role
    if (platforms) data.platforms = platforms
    if (isActive !== undefined) data.isActive = isActive
    if (password) data.password = await bcrypt.hash(password, 10)

    const user = await prisma.user.update({ where: { id: req.params.id }, data })
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, platforms: user.platforms, isActive: user.isActive })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// DELETE /api/users/:id — Delete user (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ message: 'User deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export { router as usersRoutes }
