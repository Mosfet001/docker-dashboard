/**
 * Tails and streams container logs over WebSocket.
 * Sends each log line as a JSON message: { ts, stream, line }
 */
export async function startLogsStream(docker, ws, containerId) {
  const container = docker.getContainer(containerId)

  const stream = await container.logs({
    follow: true,
    stdout: true,
    stderr: true,
    tail:   100,
    timestamps: true,
  })

  const send = (streamType, raw) => {
    if (ws.readyState !== 1) return
    const text = raw.toString().replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f]/g, '').trim()
    if (!text) return
    const [ts, ...rest] = text.split(' ')
    ws.send(JSON.stringify({ stream: streamType, ts, line: rest.join(' ') }))
  }

  // Dockerode multiplexes stdout/stderr into one stream with 8-byte headers
  stream.on('data', chunk => {
    // Header: [stream_type(1), 0,0,0, size(4)] then payload
    if (chunk.length > 8) {
      const type   = chunk[0] === 2 ? 'stderr' : 'stdout'
      const payload = chunk.slice(8)
      send(type, payload)
    } else {
      send('stdout', chunk)
    }
  })

  stream.on('error', err => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ error: err.message }))
  })

  ws.on('close', () => { try { stream.destroy() } catch {} })
}
