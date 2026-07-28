import { useEffect, useState } from 'react'

/**
 * Subscribes to Docker events via SSE (/api/system/events).
 * Returns an array of the last `maxEvents` events (newest first).
 */
export function useDockerEvents(maxEvents = 50) {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('dd_token')
    const url = token ? `/api/system/events?token=${token}` : '/api/system/events'
    const es = new EventSource(url)

    es.onmessage = e => {
      try {
        const event = JSON.parse(e.data)
        setEvents(prev => [{ ...event, _id: Date.now() + Math.random() }, ...prev].slice(0, maxEvents))
      } catch {}
    }

    es.onerror = () => es.close()

    return () => es.close()
  }, [maxEvents])

  return events
}
