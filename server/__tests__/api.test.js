/**
 * Server API tests
 * Run: cd server && npm test
 *
 * These mock dockerode so they don't require a live Docker daemon.
 */
import { jest } from '@jest/globals'

// Mock dockerode before importing app
const mockContainer = {
  inspect: jest.fn().mockResolvedValue({ Id: 'abc123', Name: '/test-container', State: { Status: 'running' } }),
  start:   jest.fn().mockResolvedValue({}),
  stop:    jest.fn().mockResolvedValue({}),
  restart: jest.fn().mockResolvedValue({}),
  remove:  jest.fn().mockResolvedValue({}),
  logs:    jest.fn().mockResolvedValue(Buffer.from('log line 1\nlog line 2')),
  stats:   jest.fn().mockResolvedValue({
    cpu_stats:    { cpu_usage: { total_usage: 2000 }, system_cpu_usage: 20000, online_cpus: 2 },
    precpu_stats: { cpu_usage: { total_usage: 1000 }, system_cpu_usage: 10000 },
    memory_stats: { usage: 104857600, limit: 1073741824 },
    networks:     {},
  }),
}

const mockDocker = {
  listContainers: jest.fn().mockResolvedValue([
    { Id: 'abc123', Names: ['/test-container'], Image: 'nginx:alpine', State: 'running', Status: 'Up 2 hours', Ports: [] }
  ]),
  getContainer: jest.fn().mockReturnValue(mockContainer),
  listImages:   jest.fn().mockResolvedValue([
    { Id: 'sha256:abc', RepoTags: ['nginx:latest'], Size: 41456640, Created: 1700000000 }
  ]),
  listVolumes:  jest.fn().mockResolvedValue({ Volumes: [{ Name: 'test-vol', Driver: 'local' }] }),
  listNetworks: jest.fn().mockResolvedValue([{ Id: 'net1', Name: 'bridge', Driver: 'bridge' }]),
  info:    jest.fn().mockResolvedValue({ ServerVersion: '24.0.0', Containers: 1 }),
  df:      jest.fn().mockResolvedValue({ LayersSize: 0, Images: [], Containers: [], Volumes: [] }),
  version: jest.fn().mockResolvedValue({ Version: '24.0.0' }),
}

jest.unstable_mockModule('dockerode', () => ({ default: jest.fn(() => mockDocker) }))
jest.unstable_mockModule('dotenv/config', () => ({}))

process.env.DISABLE_AUTH = 'true'
process.env.JWT_SECRET   = 'test-secret'

const { default: app } = await import('../index.js')
const { default: request } = await import('supertest')

describe('Health', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

describe('Containers', () => {
  test('GET /api/containers returns array', async () => {
    const res = await request(app).get('/api/containers')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].Id).toBe('abc123')
  })

  test('GET /api/containers/:id/inspect returns container data', async () => {
    const res = await request(app).get('/api/containers/abc123/inspect')
    expect(res.status).toBe(200)
    expect(res.body.Id).toBe('abc123')
  })

  test('POST /api/containers/:id/start returns ok', async () => {
    const res = await request(app).post('/api/containers/abc123/start')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  test('POST /api/containers/:id/stop returns ok', async () => {
    const res = await request(app).post('/api/containers/abc123/stop')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  test('DELETE /api/containers/:id returns ok', async () => {
    const res = await request(app).delete('/api/containers/abc123')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

describe('Images', () => {
  test('GET /api/images returns array', async () => {
    const res = await request(app).get('/api/images')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('Volumes', () => {
  test('GET /api/volumes returns array', async () => {
    const res = await request(app).get('/api/volumes')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('Networks', () => {
  test('GET /api/networks returns array', async () => {
    const res = await request(app).get('/api/networks')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('System', () => {
  test('GET /api/system/info returns server version', async () => {
    const res = await request(app).get('/api/system/info')
    expect(res.status).toBe(200)
    expect(res.body.ServerVersion).toBeDefined()
  })
})
