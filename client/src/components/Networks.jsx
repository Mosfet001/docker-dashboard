import { useState, useEffect } from 'react'
import { networks as api } from '../utils/api.js'
import PageHeader from './shared/PageHeader.jsx'

export default function Networks() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.list().then(r => setList(r.data)).finally(() => setLoading(false))
  }, [])

  const remove = async (id, name) => {
    if (!confirm(`Remove network ${name}?`)) return
    try { await api.remove(id); setList(l => l.filter(n => n.Id !== id)) }
    catch (e) { alert(e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Networks" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {loading && <div style={{ color: 'var(--text-muted)' }}>Loading…</div>}
        <div style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Name','Driver','Scope','Subnet','Containers',''].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', padding: '8px 12px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(n => (
                <tr key={n.Id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500, fontFamily: 'monospace', fontSize: 12 }}>{n.Name}</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ background: 'var(--surface-0)', border: '0.5px solid var(--border)', borderRadius: 4, fontSize: 11, padding: '2px 6px', fontFamily: 'monospace' }}>{n.Driver}</span></td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>{n.Scope}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{n.IPAM?.Config?.[0]?.Subnet ?? '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{Object.keys(n.Containers ?? {}).length}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button onClick={() => remove(n.Id, n.Name)} style={{ padding: '3px 10px', borderRadius: 5, border: '0.5px solid var(--border-danger)', background: 'transparent', color: 'var(--text-danger)', fontSize: 11, cursor: 'pointer' }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
