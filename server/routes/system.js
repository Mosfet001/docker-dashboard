import { Router } from 'express'

const r = Router()

r.get('/info',   async (req, res, next) => { try { res.json(await req.docker.info())     } catch(e){next(e)} })
r.get('/df',     async (req, res, next) => { try { res.json(await req.docker.df())       } catch(e){next(e)} })
r.get('/version',async (req, res, next) => { try { res.json(await req.docker.version())  } catch(e){next(e)} })

r.post('/prune', async (req, res, next) => {
  try {
    const [containers, images, volumes, networks] = await Promise.all([
      req.docker.pruneContainers(),
      req.docker.pruneImages(),
      req.docker.pruneVolumes(),
      req.docker.pruneNetworks(),
    ])
    res.json({ containers, images, volumes, networks })
  } catch (e) { next(e) }
})

// Stream Docker events to client as SSE
r.get('/events', async (req, res, next) => {
  try {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
    res.flushHeaders()
    const stream = await req.docker.getEvents({ since: Math.floor(Date.now() / 1000) - 3600 })
    stream.on('data', chunk => {
      try {
        const event = JSON.parse(chunk.toString())
        res.write(`data: ${JSON.stringify(event)}\n\n`)
      } catch {}
    })
    req.on('close', () => stream.destroy())
  } catch (e) { next(e) }
})

export default r
