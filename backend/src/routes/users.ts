import { Router } from 'express'
import { pool } from '../db/pool'
import bcrypt from 'bcryptjs'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role, platforms, is_active, created_at FROM users ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { email, name, password, role, platforms } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (email, name, password, role, platforms) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, platforms`,
      [email.toLowerCase(), name, hashedPassword, role || 'viewer', JSON.stringify(platforms || [])]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' })
  }
})

router.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { name, role, platforms, isActive, password } = req.body
    const updates: string[] = []
    const params: any[] = []
    let idx = 1

    if (name) { updates.push(`name=$${idx}`); params.push(name); idx++ }
    if (role) { updates.push(`role=$${idx}`); params.push(role); idx++ }
    if (platforms) { updates.push(`platforms=$${idx}`); params.push(JSON.stringify(platforms)); idx++ }
    if (isActive !== undefined) { updates.push(`is_active=$${idx}`); params.push(isActive); idx++ }
    if (password) { updates.push(`password=$${idx}`); params.push(await bcrypt.hash(password, 10)); idx++ }

    updates.push(`updated_at=NOW()`)
    params.push(req.params.id)

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id=$${idx} RETURNING id, email, name, role, platforms, is_active`,
      params
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' })
  }
})

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
    res.json({ message: 'User deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export { router as usersRoutes }
