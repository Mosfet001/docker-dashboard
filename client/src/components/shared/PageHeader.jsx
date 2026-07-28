export default function PageHeader({ title, search, onSearch, actionLabel, onAction }) {
  return (
    <div style={{ height: 50, borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10, flexShrink: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{title}</span>
      {onSearch && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '0 9px', height: 30 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>⌕</span>
          <input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search…"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--text-primary)', width: 130 }}
          />
        </div>
      )}
      {onAction && (
        <button onClick={onAction} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: 'none', background: '#42d3a5', color: '#0b3a2e', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          + {actionLabel}
        </button>
      )}
    </div>
  )
}
