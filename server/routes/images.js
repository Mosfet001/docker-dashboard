import { Router } from 'express'

const r = Router()

r.get('/', async (req, res, next) => {
  try {
    const images = await req.docker.listImages({ all: false })
    res.json(images)
  } catch (e) { next(e) }
})

r.get('/:id/inspect', async (req, res, next) => {
  try {
    res.json(await req.docker.getImage(req.params.id).inspect())
  } catch (e) { next(e) }
})

// Pull an image — streams pull progress as newline-delimited JSON
r.post('/pull', async (req, res, next) => {
  try {
    const { image } = req.body
    if (!image) return res.status(400).json({ error: 'image name required' })
    const stream = await req.docker.pull(image)
    res.set('Content-Type', 'application/x-ndjson')
    req.docker.modem.followProgress(stream,
      (err) => err ? res.end(JSON.stringify({ error: err.message })) : res.end(JSON.stringify({ done: true })),
      (event) => res.write(JSON.stringify(event) + '\n')
    )
  } catch (e) { next(e) }
})

r.delete('/:id', async (req, res, next) => {
  try {
    await req.docker.getImage(req.params.id).remove({ force: req.query.force === 'true' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Prune dangling images
r.post('/prune', async (req, res, next) => {
  try {
    const result = await req.docker.pruneImages()
    res.json(result)
  } catch (e) { next(e) }
})

export default r
