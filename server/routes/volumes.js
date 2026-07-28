import { Router } from 'express'

const r = Router()

r.get('/', async (req, res, next) => {
  try {
    const { Volumes } = await req.docker.listVolumes()
    res.json(Volumes || [])
  } catch (e) { next(e) }
})

r.get('/:name/inspect', async (req, res, next) => {
  try {
    res.json(await req.docker.getVolume(req.params.name).inspect())
  } catch (e) { next(e) }
})

r.post('/', async (req, res, next) => {
  try {
    const vol = await req.docker.createVolume(req.body)
    res.status(201).json(vol)
  } catch (e) { next(e) }
})

r.delete('/:name', async (req, res, next) => {
  try {
    await req.docker.getVolume(req.params.name).remove()
    res.json({ ok: true })
  } catch (e) { next(e) }
})

r.post('/prune', async (req, res, next) => {
  try {
    res.json(await req.docker.pruneVolumes())
  } catch (e) { next(e) }
})

export default r
