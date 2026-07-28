/**
 * Streams live CPU + memory stats for all running containers
 * over a single WebSocket connection, pushing updates every ~2 s.
 */
export async function startStatsStream(docker, ws) {
  const streams = []

  try {
    const containers = await docker.listContainers({ all: false })

    for (const info of containers) {
      const container = docker.getContainer(info.Id)

      let stream
      try {
        stream = await container.stats({ stream: true })
      } catch {
        continue // container may have stopped between list and stats
      }

      streams.push(stream)

      stream.on('data', chunk => {
        if (ws.readyState !== 1 /* OPEN */) return
        try {
          const s = JSON.parse(chunk.toString())

          const cpuDelta = s.cpu_stats.cpu_usage.total_usage - s.precpu_stats.cpu_usage.total_usage
          const sysDelta = (s.cpu_stats.system_cpu_usage ?? 0) - (s.precpu_stats.system_cpu_usage ?? 0)
          const cpus     = s.cpu_stats.online_cpus || 1
          const cpu      = sysDelta > 0 ? parseFloat(((cpuDelta / sysDelta) * cpus * 100).toFixed(1)) : 0

          const memUsage = s.memory_stats.usage ?? 0
          const memLimit = s.memory_stats.limit ?? 1
          const mem      = parseFloat(((memUsage / memLimit) * 100).toFixed(1))

          const netRx = Object.values(s.networks || {}).reduce((a, n) => a + n.rx_bytes, 0)
          const netTx = Object.values(s.networks || {}).reduce((a, n) => a + n.tx_bytes, 0)

          ws.send(JSON.stringify({
            id:   info.Id,
            name: info.Names?.[0]?.replace(/^\//, '') ?? info.Id.slice(0, 12),
            cpu,
            mem,
            memUsage,
            memLimit,
            netRx,
            netTx,
          }))
        } catch { /* malformed chunk — ignore */ }
      })

      stream.on('error', () => { /* container gone */ })
    }

    ws.on('close', () => streams.forEach(s => { try { s.destroy() } catch {} }))

  } catch (err) {
    if (ws.readyState === 1) ws.send(JSON.stringify({ error: err.message }))
  }
}
