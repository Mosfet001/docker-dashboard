import 'dotenv/config'
import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import cors from 'cors'
import Docker from 'dockerode'

import containersRouter from './routes/containers.js'
import imagesRouter from './routes/images.js'
import volumesRouter from './routes/volumes.js'
import networksRouter from './routes/networks.js'
import systemRouter from './routes/system.js'
import authRouter from './routes/auth.js'
import { authMiddleware } from './middleware/auth.js'
import { startStatsStream } from './ws/stats.js'
import { startLogsStream } from './ws/logs.js'

const app = express()
const server = http.createServer(app)

// WebSocket servers
const statsWss = new WebSocketServer({ server, path: '/ws/stats' })
const logsWss  = new WebSocketServer({ server, path: '/ws/logs' })
const execWss  = new WebSocketServer({ server, path: '/ws/exec' })

// Docker client — connects via unix socket (requires /var/run/docker.sock mount)
const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
})

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Attach docker to every request
app.use((req, _res, next) => { req.docker = docker; next() })

// Public routes (no auth required)
app.use('/api/auth', authRouter)
app.get('/api/health', (_req, res) => res.json({ ok: true, version: '1.0.0', ts: new Date().toISOString() }))

// Protected routes
app.use('/api/containers', authMiddleware, containersRouter)
app.use('/api/images',     authMiddleware, imagesRouter)
app.use('/api/volumes',    authMiddleware, volumesRouter)
app.use('/api/networks',   authMiddleware, networksRouter)
app.use('/api/system',     authMiddleware, systemRouter)

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message)
  const status = err.statusCode || err.status || 500
  res.status(status).json({ error: err.message || 'Internal server error' })
})

// WebSocket: live container stats
statsWss.on('connection', (ws, req) => {
  console.log('[ws/stats] client connected')
  startStatsStream(docker, ws).catch(e => console.error('[ws/stats]', e.message))
  ws.on('close', () => console.log('[ws/stats] client disconnected'))
})

// WebSocket: container log tail
logsWss.on('connection', (ws, req) => {
  const id = new URL(req.url, 'http://x').searchParams.get('id')
  console.log('[ws/logs] streaming logs for', id)
  if (id) startLogsStream(docker, ws, id).catch(e => console.error('[ws/logs]', e.message))
})

// WebSocket: docker exec (interactive terminal)
execWss.on('connection', (ws, req) => {
  const id = new URL(req.url, 'http://x').searchParams.get('id')
  if (!id) { ws.close(); return }
  console.log('[ws/exec] exec session for', id)
  openExecSession(docker, ws, id).catch(e => console.error('[ws/exec]', e.message))
})

async function openExecSession(docker, ws, containerId) {
  const container = docker.getContainer(containerId)
  const exec = await container.exec({
    Cmd: ['/bin/sh'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true
  })
  const stream = await exec.start({ hijack: true, stdin: true })
  stream.on('data', chunk => ws.readyState === 1 && ws.send(chunk.toString()))
  ws.on('message', data => stream.write(data))
  ws.on('close', () => stream.destroy())
}

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`[server] Docker Dashboard API running on http://localhost:${PORT}`)
  console.log(`[server] Auth: ${process.env.JWT_SECRET ? 'JWT enabled' : 'WARNING: no JWT_SECRET set'}`)
})

export default app
