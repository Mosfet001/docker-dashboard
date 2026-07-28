import { useEffect, useRef, useState } from 'react'
import PageHeader from './shared/PageHeader.jsx'

/**
 * Embeds a real xterm.js terminal.
 * In dev mode (no WebSocket exec backend), falls back to a mock shell.
 * In production, connects to /ws/exec?id=<containerId> for live docker exec.
 */
export default function Terminal() {
  const termRef = useRef(null)
  const xtermRef = useRef(null)
  const wsRef = useRef(null)
  const [containerId, setContainerId] = useState('')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let term, fitAddon

    // Dynamically import xterm to avoid SSR issues
    Promise.all([
      import('xterm'),
      import('xterm-addon-fit'),
      import('xterm-addon-web-links'),
    ]).then(([{ Terminal: XTerm }, { FitAddon }, { WebLinksAddon }]) => {
      if (!termRef.current) return

      term = new XTerm({
        theme: {
          background: '#0a0e17',
          foreground: '#c9d1d9',
          cursor: '#42d3a5',
          cursorAccent: '#0a0e17',
          selectionBackground: 'rgba(66,211,165,0.25)',
          black: '#0d1117', red: '#f85149', green: '#56d364',
          yellow: '#e3b341', blue: '#388bfd', magenta: '#bc8cff',
          cyan: '#39c5cf', white: '#b1bac4',
        },
        fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        fontSize: 13,
        lineHeight: 1.5,
        cursorBlink: true,
        convertEol: true,
      })

      fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.loadAddon(new WebLinksAddon())
      term.open(termRef.current)
      fitAddon.fit()
      xtermRef.current = term

      term.writeln('\x1b[32m  Docker Dashboard — Interactive Terminal\x1b[0m')
      term.writeln('\x1b[90m  Select a container above to exec into it,\x1b[0m')
      term.writeln('\x1b[90m  or type docker commands in the host shell.\x1b[0m\r\n')
      writePrompt(term)

      // Fallback local command handler (no WebSocket)
      term.onData(data => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(data)
          return
        }
        // Echo locally
        if (data === '\r') {
          term.write('\r\n')
          writePrompt(term)
        } else if (data === '\x7f') {
          term.write('\b \b')
        } else {
          term.write(data)
        }
      })

      const ro = new ResizeObserver(() => fitAddon?.fit())
      ro.observe(termRef.current)
      return () => ro.disconnect()
    })

    return () => { term?.dispose() }
  }, [])

  const writePrompt = (term) => term.write('\x1b[32mjinn@vps\x1b[0m:\x1b[34m~\x1b[0m$ ')

  const connectToContainer = (id) => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    if (!id) { setConnected(false); return }

    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${location.host}/ws/exec?id=${id}`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      xtermRef.current?.writeln(`\r\n\x1b[33mConnected to container: ${id.slice(0,12)}\x1b[0m\r\n`)
    }
    ws.onmessage = e => xtermRef.current?.write(e.data)
    ws.onclose   = () => { setConnected(false); xtermRef.current?.writeln('\r\n\x1b[31mConnection closed\x1b[0m\r\n') }
    ws.onerror   = () => { setConnected(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Terminal" />
      <div style={{ padding: '10px 18px', borderBottom: '0.5px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Container ID (exec):</label>
        <input
          type="text"
          value={containerId}
          onChange={e => setContainerId(e.target.value)}
          placeholder="Leave blank for host shell"
          style={{ flex: 1, border: '0.5px solid var(--border-strong)', borderRadius: 6, padding: '4px 8px', fontSize: 12, background: 'var(--surface-1)', color: 'var(--text-primary)', outline: 'none' }}
        />
        <button
          onClick={() => connectToContainer(containerId)}
          style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#42d3a5', color: '#0b3a2e', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
        >
          {connected ? 'Reconnect' : 'Connect'}
        </button>
        {connected && <span style={{ fontSize: 11, color: '#42d3a5' }}>● Connected</span>}
      </div>
      <div ref={termRef} style={{ flex: 1, overflow: 'hidden', padding: 4 }} />
    </div>
  )
}
