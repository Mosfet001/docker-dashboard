import { Router } from 'express'

const r = Router()

// List all containers (running + stopped)
r.get('/', async (req, res, next) => {
  try {
    const list = await req.docker.listContainers({ all: true })
    res.json(list)
  } catch (e) { next(e) }
})

// Inspect a single container
r.get('/:id/inspect', async (req, res, next) => {
  try {
    const data = await req.docker.getContainer(req.params.id).inspect()
    res.json(data)
  } catch (e) { next(e) }
})

// Tail logs (last N lines, default 100)
r.get('/:id/logs', async (req, res, next) => {
  try {
    const tail = parseInt(req.query.tail) || 100
    const c = req.docker.getContainer(req.params.id)
    const stream = await c.logs({ stdout: true, stderr: true, tail, timestamps: true })
    res.set('Content-Type', 'text/plain')
    res.send(stream.toString())
  } catch (e) { next(e) }
})

// One-shot resource stats (no streaming)
r.get('/:id/stats', async (req, res, next) => {
  try {
    const raw = await req.docker.getContainer(req.params.id).stats({ stream: false })
    const cpuDelta = raw.cpu_stats.cpu_usage.total_usage - raw.precpu_stats.cpu_usage.total_usage
    const sysDelta = raw.cpu_stats.system_cpu_usage    - raw.precpu_stats.system_cpu_usage
    const cpus     = raw.cpu_stats.online_cpus || 1
    res.json({
      cpu:  parseFloat(((cpuDelta / sysDelta) * cpus * 100).toFixed(2)),
      memUsage: raw.memory_stats.usage,
      memLimit: raw.memory_stats.limit,
      memPct: parseFloat(((raw.memory_stats.usage / raw.memory_stats.limit) * 100).toFixed(2)),
      netRx: Object.values(raw.networks || {}).reduce((a, n) => a + n.rx_bytes, 0),
      netTx: Object.values(raw.networks || {}).reduce((a, n) => a + n.tx_bytes, 0),
    })
  } catch (e) { next(e) }
})

r.post('/:id/start',   async (req, res, next) => { try { await req.docker.getContainer(req.params.id).start();   res.json({ ok: true }) } catch (e) { next(e) } })
r.post('/:id/stop',    async (req, res, next) => { try { await req.docker.getContainer(req.params.id).stop();    res.json({ ok: true }) } catch (e) { next(e) } })
r.post('/:id/restart', async (req, res, next) => { try { await req.docker.getContainer(req.params.id).restart(); res.json({ ok: true }) } catch (e) { next(e) } })
r.post('/:id/pause',   async (req, res, next) => { try { await req.docker.getContainer(req.params.id).pause();   res.json({ ok: true }) } catch (e) { next(e) } })
r.post('/:id/unpause', async (req, res, next) => { try { await req.docker.getContainer(req.params.id).unpause(); res.json({ ok: true }) } catch (e) { next(e) } })

r.delete('/:id', async (req, res, next) => {
  try {
    await req.docker.getContainer(req.params.id).remove({ force: req.query.force === 'true' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Create a new container
r.post('/', async (req, res, next) => {
  try {
    const container = await req.docker.createContainer(req.body)
    await container.start()
    res.status(201).json({ id: container.id })
  } catch (e) { next(e) }
})

export default r
