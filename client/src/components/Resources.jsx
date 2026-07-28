import { useEffect, useRef } from 'react'
import PageHeader from './shared/PageHeader.jsx'

function Sparkline({ data, color, width = 280, height = 55 }) {
  const ref = useRef()
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')
    c.width = width; c.height = height
    ctx.clearRect(0, 0, width, height)
    if (data.length < 2) return
    const max = Math.max(...data) * 1.2 || 1
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - (v / max) * (height * 0.85) - 4
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [data, color, width, height])
  return <canvas ref={ref} style={{ width: '100%', height }} />
}

export default function Resources({ stats }) {
  const statValues = Object.values(stats)
  const cpuData  = statValues.map(s => +s.cpu || 0)
  const memData  = statValues.map(s => +s.mem || 0)
  const totalCpu = cpuData.reduce((a, v) => a + v, 0).toFixed(1)
  const avgMem   = memData.length ? (memData.reduce((a, v) => a + v, 0) / memData.length).toFixed(1) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Resource usage" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            { title: 'CPU usage',  current: `${totalCpu}%`,           data: cpuData,  color: '#42d3a5' },
            { title: 'Memory',     current: `avg ${avgMem}%`,         data: memData,  color: '#7ab3f5' },
          ].map(card => (
            <div key={card.title} style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{card.title}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: card.color }}>{card.current}</span>
              </div>
              <Sparkline data={card.data} color={card.color} />
            </div>
          ))}
        </div>

        {/* Per-container table */}
        <div style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Per-container breakdown</div>
          {statValues.length === 0
            ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Waiting for live stats… (WebSocket connects on page load)</div>
            : statValues.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>{s.name}</span>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>CPU</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: +s.cpu > 50 ? '#e24b4a' : '#42d3a5' }}>{(+s.cpu).toFixed(1)}%</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>MEM</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: +s.mem > 70 ? '#e24b4a' : '#42d3a5' }}>{(+s.mem).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
