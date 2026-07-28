import { useState, useEffect } from 'react'
import { images as api } from '../utils/api.js'
import PageHeader from './shared/PageHeader.jsx'

export default function Images() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pulling, setPulling] = useState(false)
  const [pullImage, setPullImage] = useState('')

  const load = async () => {
    try { const res = await api.list(); setList(res.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handlePull = async () => {
    if (!pullImage) return
    setPulling(true)
    try { await api.pull(pullImage); await load() }
    catch (e) { alert(`Pull failed: ${e.message}`) }
    finally { setPulling(false); setPullImage('') }
  }

  const handleRemove = async (id) => {
    if (!confirm('Remove this image?')) return
    try { await api.remove(id); await load() }
    catch (e) { alert(`Remove failed: ${e.message}`) }
  }

  const fmt = (bytes) => {
    if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + ' GB'
    return (bytes / 1e6).toFixed(0) + ' MB'
  }

  const filtered = list.filter(img => {
    const tag = img.RepoTags?.[0] ?? ''
    return !search || tag.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Images" search={search} onSearch={setSearch} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* Pull bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            type="text" value={pullImage} onChange={e => setPullImage(e.target.value)}
            placeholder="nginx:alpine, postgres:15, node:20…"
            onKeyDown={e => e.key === 'Enter' && handlePull()}
            style={{ flex: 1, border: '0.5px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: 'var(--surface-1)', color: 'var(--text-primary)', outline: 'none' }}
          />
          <button onClick={handlePull} disabled={pulling} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#42d3a5', color: '#0b3a2e', fontSize: 13, fontWeight: 500, cursor: pulling ? 'wait' : 'pointer' }}>
            {pulling ? 'Pulling…' : 'Pull image'}
          </button>
          <button onClick={() => { if(confirm('Prune all unused images?')) api.prune().then(load) }} style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid var(--border-strong)', background: 'transparent', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
            Prune unused
          </button>
        </div>

        {loading && <div style={{ color: 'var(--text-muted)' }}>Loading…</div>}

        <div style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Image', 'Tag', 'ID', 'Size', 'Created', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', padding: '8px 12px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(img => {
                const [name, tag] = (img.RepoTags?.[0] ?? '<none>:<none>').split(':')
                const id = img.Id?.replace('sha256:', '').slice(0, 12) ?? '—'
                const created = new Date(img.Created * 1000).toLocaleDateString()
                return (
                  <tr key={img.Id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500, fontFamily: 'monospace', fontSize: 12 }}>{name}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ background: 'var(--surface-0)', border: '0.5px solid var(--border)', borderRadius: 4, fontSize: 11, padding: '2px 6px', fontFamily: 'monospace' }}>{tag}</span></td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{id}</td>
                    <td style={{ padding: '10px 12px' }}>{fmt(img.Size)}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>{created}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => handleRemove(img.Id)} style={{ padding: '3px 10px', borderRadius: 5, border: '0.5px solid var(--border-danger)', background: 'transparent', color: 'var(--text-danger)', fontSize: 11, cursor: 'pointer' }}>Remove</button>
                    </td>
                  </tr>
                )
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>No images found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
