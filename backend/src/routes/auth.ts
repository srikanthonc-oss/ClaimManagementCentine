import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = Router()
const prisma = new PrismaClient()

// POST /api/auth/sign-in
router.post('/sign-in', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated. Contact your administrator.' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, platforms: user.platforms },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, platforms: user.platforms },
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/sign-up
router.post('/sign-up', async (req, res) => {
  try {
    const { email, name, password } = req.body

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: 'viewer',
        platforms: [],
      },
    })

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, platforms: user.platforms },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, platforms: user.platforms },
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as authRoutes }
