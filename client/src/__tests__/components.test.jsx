import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mock axios api module ─────────────────────────────────────
vi.mock('../utils/api.js', () => ({
  default: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  containers: {
    list:    vi.fn().mockResolvedValue({ data: [
      { Id: 'abc123456789', Names: ['/nginx-proxy'], Image: 'nginx:alpine', State: 'running', Status: 'Up 2 hours', Ports: [] },
      { Id: 'def987654321', Names: ['/postgres-db'], Image: 'postgres:15',   State: 'stopped', Status: 'Exited (0)',  Ports: [] },
    ]}),
    stop:    vi.fn().mockResolvedValue({ data: { ok: true } }),
    start:   vi.fn().mockResolvedValue({ data: { ok: true } }),
    restart: vi.fn().mockResolvedValue({ data: { ok: true } }),
    remove:  vi.fn().mockResolvedValue({ data: { ok: true } }),
    logs:    vi.fn().mockResolvedValue({ data: '2025-07-26 log line 1\n2025-07-26 log line 2' }),
  },
  images: {
    list:   vi.fn().mockResolvedValue({ data: [
      { Id: 'sha256:aaa', RepoTags: ['nginx:alpine'], Size: 41456640, Created: 1700000000 },
      { Id: 'sha256:bbb', RepoTags: ['postgres:15'],  Size: 245366784, Created: 1700000000 },
    ]}),
    remove: vi.fn().mockResolvedValue({ data: { ok: true } }),
    pull:   vi.fn().mockResolvedValue({ data: { done: true } }),
    prune:  vi.fn().mockResolvedValue({ data: {} }),
  },
  volumes: {
    list:   vi.fn().mockResolvedValue({ data: [
      { Name: 'postgres_data', Driver: 'local', Mountpoint: '/var/lib/docker/volumes/postgres_data/_data' },
    ]}),
    remove: vi.fn().mockResolvedValue({ data: { ok: true } }),
  },
  networks: {
    list:   vi.fn().mockResolvedValue({ data: [
      { Id: 'net1', Name: 'bridge', Driver: 'bridge', Scope: 'local', IPAM: { Config: [{ Subnet: '172.17.0.0/16' }] }, Containers: {} },
    ]}),
    remove: vi.fn().mockResolvedValue({ data: { ok: true } }),
  },
  auth: {
    login:  vi.fn().mockResolvedValue({ data: { token: 'test-token', username: 'admin' } }),
    logout: vi.fn().mockResolvedValue({ data: { ok: true } }),
    me:     vi.fn().mockResolvedValue({ data: { username: 'admin', role: 'admin' } }),
  },
}))

// ── Tests ─────────────────────────────────────────────────────
import Containers from '../components/Containers.jsx'
import Images     from '../components/Images.jsx'
import Volumes    from '../components/Volumes.jsx'
import Networks   from '../components/Networks.jsx'
import Login      from '../components/Login.jsx'
import Sidebar    from '../components/Sidebar.jsx'

describe('Login', () => {
  it('renders login form', () => {
    render(<Login onLogin={vi.fn()} />)
    expect(screen.getByPlaceholderText('admin')).toBeInTheDocument()
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })

  it('calls onLogin with token on success', async () => {
    const { auth } = await import('../utils/api.js')
    const onLogin = vi.fn()
    render(<Login onLogin={onLogin} />)
    await userEvent.type(screen.getByPlaceholderText('admin'), 'admin')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'changeme')
    fireEvent.click(screen.getByText('Sign in'))
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('test-token', { username: 'admin' }))
  })
})

describe('Sidebar', () => {
  it('renders navigation items', () => {
    render(<Sidebar active="containers" onNavigate={vi.fn()} user={{ username: 'admin', role: 'admin' }} onLogout={vi.fn()} alertCount={0} />)
    expect(screen.getByText('Containers')).toBeInTheDocument()
    expect(screen.getByText('Images')).toBeInTheDocument()
    expect(screen.getByText('Terminal')).toBeInTheDocument()
  })

  it('calls onNavigate when nav item clicked', async () => {
    const onNavigate = vi.fn()
    render(<Sidebar active="containers" onNavigate={onNavigate} user={{ username: 'admin' }} onLogout={vi.fn()} alertCount={0} />)
    fireEvent.click(screen.getByText('Images'))
    expect(onNavigate).toHaveBeenCalledWith('images')
  })

  it('shows alert badge when alertCount > 0', () => {
    render(<Sidebar active="containers" onNavigate={vi.fn()} user={{ username: 'admin' }} onLogout={vi.fn()} alertCount={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})

describe('Containers', () => {
  it('renders container list after loading', async () => {
    render(<Containers stats={{}} />)
    await waitFor(() => expect(screen.getByText('nginx-proxy')).toBeInTheDocument())
    expect(screen.getByText('postgres-db')).toBeInTheDocument()
  })

  it('shows running/stopped status badges', async () => {
    render(<Containers stats={{}} />)
    await waitFor(() => expect(screen.getByText('running')).toBeInTheDocument())
    expect(screen.getByText('stopped')).toBeInTheDocument()
  })

  it('filters by running tab', async () => {
    render(<Containers stats={{}} />)
    await waitFor(() => screen.getByText('nginx-proxy'))
    fireEvent.click(screen.getByText('Running'))
    await waitFor(() => expect(screen.getByText('nginx-proxy')).toBeInTheDocument())
    expect(screen.queryByText('postgres-db')).not.toBeInTheDocument()
  })

  it('expands log drawer on row click', async () => {
    render(<Containers stats={{}} />)
    await waitFor(() => screen.getByText('nginx-proxy'))
    fireEvent.click(screen.getByText('nginx-proxy').closest('div[style]'))
    await waitFor(() => expect(screen.getByText(/log line 1/)).toBeInTheDocument())
  })
})

describe('Images', () => {
  it('renders image table', async () => {
    render(<Images />)
    await waitFor(() => expect(screen.getByText('nginx')).toBeInTheDocument())
    expect(screen.getByText('postgres')).toBeInTheDocument()
  })

  it('shows pull image input', () => {
    render(<Images />)
    expect(screen.getByPlaceholderText(/nginx:alpine/)).toBeInTheDocument()
  })
})

describe('Volumes', () => {
  it('renders volume cards', async () => {
    render(<Volumes />)
    await waitFor(() => expect(screen.getByText('postgres_data')).toBeInTheDocument())
  })
})

describe('Networks', () => {
  it('renders network table', async () => {
    render(<Networks />)
    await waitFor(() => expect(screen.getByText('bridge')).toBeInTheDocument())
  })
})
