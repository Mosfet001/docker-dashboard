import { useState, useEffect, useCallback } from 'react'
import { containers as api } from '../utils/api.js'
import PageHeader from './shared/PageHeader.jsx'
import MetricCard from './shared/MetricCard.jsx'
import StatusBadge from './shared/StatusBadge.jsx'
import MeterBar from './shared/MeterBar.jsx'

export default function Containers({ stats }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [openLog, setOpenLog] = useState(null)
  const [logs, setLogs] = useState({})
  const [actionLoading, setActionLoading] = useState({})

  const load = useCallback(async () => {
    try {
      const res = await api.list()
      setList(res.data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t) }, [load])

  const action = async (id, fn, label) => {
    setActionLoading(p => ({ ...p, [id]: label }))
    try { await fn(id); await load() }
    catch (e) { alert(`${label} failed: ${e.message}`) }
    finally { setActionLoading(p => ({ ...p, [id]: null })) }
  }

  const toggleLog = async (id) => {
    if (openLog === id) { setOpenLog(null); return }
    setOpenLog(id)
    if (!logs[id]) {
      try {
        const res = await api.logs(id)
        setLogs(p => ({ ...p, [id]: res.data }))
      } catch { setLogs(p => ({ ...p, [id]: 'Could not fetch logs.' })) }
    }
  }

  const filtered = list.filter(c => {
    const st = c.State
    if (filter === 'running' && st !== 'running') return false
    if (filter === 'stopped' && st === 'running') return false
    if (search && !c.Names?.[0]?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const running = list.filter(c => c.State === 'running').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Containers"
        search={search}
        onSearch={setSearch}
        actionLabel="New container"
        onAction={() => alert('Use docker run or POST /api/containers')}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          <MetricCard label="Running" value={running} sub={`of ${list.length} total`} accent="#42d3a5" />
          <MetricCard label="Stopped" value={list.length - running} sub="containers" accent="var(--text-danger)" />
          <MetricCard label="Images" value="—" sub="see Images panel" />
          <MetricCard label="Avg CPU" value={running ? `${(Object.values(stats).reduce((a,s)=>a+(+s.cpu||0),0)/Math.max(running,1)).toFixed(1)}%` : '0%'} sub="running containers" />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 13, fontWeight: 500 }}>Container list</h2>
          <div style={{ display: 'flex', gap: 3, background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 8, padding: 2 }}>
            {['all','running','stopped'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: filter === f ? 'var(--surface-2)' : 'transparent', color: filter === f ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: filter === f ? 500 : 400 }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading && <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading…</div>}
        {error   && <div style={{ color: 'var(--text-danger)', padding: 20 }}>Error: {error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => {
            const id = c.Id
            const name = c.Names?.[0]?.replace(/^\//, '') ?? id.slice(0,12)
            const liveStats = stats[id] ?? {}
            const cpu = liveStats.cpu ?? 0
            const mem = liveStats.mem ?? 0
            const isOpen = openLog === id
            const busy = actionLoading[id]

            return (
              <div key={id} style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer' }} onClick={() => toggleLog(id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 1 }}>{name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.Image} · {c.Status}
                    </div>
                  </div>
                  <StatusBadge status={c.State} />
                  <MeterBar label="CPU" value={cpu} />
                  <MeterBar label="MEM" value={mem} />
                  <div style={{ display: 'flex', gap: 3 }} onClick={e => e.stopPropagation()}>
                    {c.State === 'running'
                      ? <ActionBtn label={busy==='stop'?'…':'■'} title="Stop"    onClick={() => action(id, api.stop,    'stop')}    />
                      : <ActionBtn label={busy==='start'?'…':'▶'} title="Start"  onClick={() => action(id, api.start,  'start')}   />
                    }
                    <ActionBtn label={busy==='restart'?'…':'↺'} title="Restart" onClick={() => action(id, api.restart, 'restart')} />
                    <ActionBtn label="⊗" title="Remove" danger onClick={() => { if(confirm(`Remove ${name}?`)) action(id, api.remove, 'remove') }} />
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '0.5px solid var(--border)', background: '#0e1420', fontFamily: 'monospace', fontSize: 11, padding: '10px 14px', maxHeight: 160, overflowY: 'auto', lineHeight: 1.65, color: '#6a7d8f', whiteSpace: 'pre-wrap' }}>
                    {logs[id] ?? 'Loading logs…'}
                  </div>
                )}
              </div>
            )
          })}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No containers match this filter</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ label, title, onClick, danger }) {
  return (
    <button onClick={onClick} title={title} style={{ width: 26, height: 26, borderRadius: 5, border: '0.5px solid var(--border)', background: 'transparent', color: danger ? 'var(--text-danger)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {label}
    </button>
  )
}
