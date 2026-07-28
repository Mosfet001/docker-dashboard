import jwt from 'jsonwebtoken'

export function authMiddleware(req, res, next) {
  // Skip auth if disabled (dev mode only)
  if (process.env.DISABLE_AUTH === 'true') return next()

  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }

  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'change-me-in-production')
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
