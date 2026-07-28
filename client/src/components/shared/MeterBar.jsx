export default function MeterBar({ label, value }) {
  const pct = Math.min(Math.max(+value || 0, 0), 100)
  const color = pct > 75 ? '#e24b4a' : pct > 50 ? '#f5a623' : '#42d3a5'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, minWidth: 52 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ width: 52, height: 3, background: 'var(--border-strong)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .5s' }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color }}>{pct.toFixed(1)}%</div>
    </div>
  )
}
