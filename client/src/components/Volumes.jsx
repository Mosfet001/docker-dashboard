import { useState, useEffect } from 'react'
import { volumes as api } from '../utils/api.js'
import PageHeader from './shared/PageHeader.jsx'

export default function Volumes() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try { const res = await api.list(); setList(res.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const remove = async (name) => {
    if (!confirm(`Remove volume ${name}? This is irreversible.`)) return
    try { await api.remove(name); await load() }
    catch (e) { alert(`Failed: ${e.message}`) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Volumes" onAction={() => alert('POST /api/volumes with { Name, Driver }')} actionLabel="Create volume" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {loading && <div style={{ color: 'var(--text-muted)' }}>Loading…</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {list.map(v => (
            <div key={v.Name} style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13, fontFamily: 'monospace' }}>{v.Name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>driver: {v.Driver}</div>
                </div>
                <button onClick={() => remove(v.Name)} style={{ padding: '3px 10px', borderRadius: 5, border: '0.5px solid var(--border-danger)', background: 'transparent', color: 'var(--text-danger)', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-start' }}>Remove</button>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--surface-0)', borderRadius: 4, padding: '4px 8px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                {v.Mountpoint ?? '—'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Created: {v.CreatedAt ? new Date(v.CreatedAt).toLocaleDateString() : '—'}
              </div>
            </div>
          ))}
          {!loading && list.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No volumes found</div>}
        </div>
      </div>
    </div>
  )
}
