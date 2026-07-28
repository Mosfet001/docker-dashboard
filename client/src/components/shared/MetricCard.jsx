export default function MetricCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: accent ?? 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{sub}</div>
    </div>
  )
}
