import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db/pool'

const router = Router()

// POST /api/auth/sign-in
router.post('/sign-in', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact your administrator.' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, platforms: user.platforms },
      process.env.JWT_SECRET || 'agentic-claims-jwt-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, platforms: user.platforms },
    })
  } catch (error) {
    console.error('Sign-in error:', error)
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

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (email, name, password, role, platforms) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [email.toLowerCase(), name, hashedPassword, 'viewer', JSON.stringify([])]
    )
    const user = result.rows[0]

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, platforms: user.platforms },
      process.env.JWT_SECRET || 'agentic-claims-jwt-secret',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, platforms: user.platforms },
    })
  } catch (error) {
    console.error('Sign-up error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as authRoutes }
