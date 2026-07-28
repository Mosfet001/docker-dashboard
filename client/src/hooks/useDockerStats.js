import { useEffect, useState, useRef } from 'react'

/**
 * Subscribes to the /ws/stats WebSocket and returns a map of
 * containerId → { cpu, mem, memUsage, memLimit, netRx, netTx }
 * updated in real-time.
 */
export function useDockerStats() {
  const [stats, setStats] = useState({})
  const wsRef = useRef(null)

  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${location.host}/ws/stats`)
    wsRef.current = ws

    ws.onmessage = e => {
      try {
        const d = JSON.parse(e.data)
        if (d.error) return console.warn('[ws/stats]', d.error)
        setStats(prev => ({ ...prev, [d.id]: d }))
      } catch {}
    }

    ws.onerror = () => console.warn('[ws/stats] connection error')

    // Reconnect after 5 s on unexpected close
    ws.onclose = () => {
      setTimeout(() => {
        if (wsRef.current === ws) setStats({}) // clear stale data
      }, 5000)
    }

    return () => { ws.close(); wsRef.current = null }
  }, [])

  return stats
}
