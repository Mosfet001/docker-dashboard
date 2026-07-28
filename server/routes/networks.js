import { Router } from 'express'

const r = Router()

r.get('/', async (req, res, next) => {
  try {
    res.json(await req.docker.listNetworks())
  } catch (e) { next(e) }
})

r.get('/:id/inspect', async (req, res, next) => {
  try {
    res.json(await req.docker.getNetwork(req.params.id).inspect())
  } catch (e) { next(e) }
})

r.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await req.docker.createNetwork(req.body))
  } catch (e) { next(e) }
})

r.delete('/:id', async (req, res, next) => {
  try {
    await req.docker.getNetwork(req.params.id).remove()
    res.json({ ok: true })
  } catch (e) { next(e) }
})

r.post('/prune', async (req, res, next) => {
  try {
    res.json(await req.docker.pruneNetworks())
  } catch (e) { next(e) }
})

export default r
