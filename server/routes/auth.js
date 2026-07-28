import { Router } from 'express'
import jwt from 'jsonwebtoken'

const r = Router()

// Single-user auth — credentials from .env
// For multi-user, replace with a database lookup
r.post('/login', (req, res) => {
  const { username, password } = req.body

  const validUser = process.env.DASHBOARD_USER || 'admin'
  const validPass = process.env.DASHBOARD_PASS || 'changeme'

  if (username !== validUser || password !== validPass) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    process.env.JWT_SECRET || 'change-me-in-production',
    { expiresIn: process.env.JWT_EXPIRES || '24h' }
  )

  res.json({ token, username, expiresIn: process.env.JWT_EXPIRES || '24h' })
})

r.post('/logout', (_req, res) => res.json({ ok: true }))

r.get('/me', (req, res) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const user = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'change-me-in-production')
    res.json({ username: user.username, role: user.role })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default r
