import { useState } from 'react'
import PageHeader from './shared/PageHeader.jsx'

const SEV = {
  die:     { label: 'Error',   bg: 'var(--bg-danger)',   color: 'var(--text-danger)',  icon: '✕' },
  oom:     { label: 'Error',   bg: 'var(--bg-danger)',   color: 'var(--text-danger)',  icon: '!' },
  kill:    { label: 'Warning', bg: 'var(--bg-warning)',  color: 'var(--text-warning)', icon: '⚠' },
  stop:    { label: 'Info',    bg: 'var(--bg-accent)',   color: 'var(--text-accent)',  icon: '■' },
  start:   { label: 'Info',    bg: 'var(--bg-accent)',   color: 'var(--text-accent)',  icon: '▶' },
  create:  { label: 'Info',    bg: 'var(--bg-accent)',   color: 'var(--text-accent)',  icon: '+' },
  destroy: { label: 'Warning', bg: 'var(--bg-warning)',  color: 'var(--text-warning)', icon: '🗑' },
  default: { label: 'Info',    bg: 'var(--surface-1)',   color: 'var(--text-secondary)',icon: '·' },
}

export default function Alerts({ events = [] }) {
  const [filter, setFilter] = useState('all')
  const [dismissed, setDismissed] = useState(new Set())

  const filtered = events
    .filter(e => !dismissed.has(e._id))
    .filter(e => {
      if (filter === 'all') return true
      const sev = SEV[e.Action] ?? SEV.default
      return sev.label.toLowerCase() === filter
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Alerts and events" onAction={() => setDismissed(new Set(events.map(e => e._id)))} actionLabel="Mark all read" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* Live indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#42d3a5', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Live — streaming Docker events</span>
          </div>
          {['all','error','warning','info'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 10px', borderRadius: 20, border: '0.5px solid var(--border)', background: filter === f ? 'var(--surface-2)' : 'transparent', color: filter === f ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', fontWeight: filter === f ? 500 : 400 }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            {events.length === 0 ? 'Waiting for Docker events…' : 'All clear'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(e => {
            const s = SEV[e.Action] ?? SEV.default
            const name = e.Actor?.Attributes?.name ?? e.id?.slice(0, 12) ?? '—'
            const ts = e.time ? new Date(e.time * 1000).toLocaleTimeString() : '—'
            return (
              <div key={e._id} style={{ display: 'flex', gap: 12, background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{s.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{e.Action} — {name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Type: {e.Type} · Image: {e.Actor?.Attributes?.image ?? '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ts}</span>
                  <button onClick={() => setDismissed(d => new Set([...d, e._id]))} style={{ fontSize: 10, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>dismiss</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
