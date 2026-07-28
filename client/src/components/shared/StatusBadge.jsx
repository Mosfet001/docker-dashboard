const MAP = {
  running: { bg: '#e6f7f0', color: '#0d6e4e', label: 'running' },
  stopped: { bg: 'var(--bg-danger)', color: 'var(--text-danger)', label: 'stopped' },
  exited:  { bg: 'var(--bg-danger)', color: 'var(--text-danger)', label: 'exited' },
  paused:  { bg: 'var(--bg-warning)', color: 'var(--text-warning)', label: 'paused' },
  created: { bg: 'var(--bg-accent)', color: 'var(--text-accent)', label: 'created' },
}

export default function StatusBadge({ status }) {
  const s = MAP[status] ?? { bg: 'var(--surface-1)', color: 'var(--text-muted)', label: status }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.color, flexShrink: 0 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      {s.label}
    </span>
  )
}
