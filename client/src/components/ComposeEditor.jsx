import { useState } from 'react'
import PageHeader from './shared/PageHeader.jsx'

const DEFAULT_COMPOSE = `version: '3.9'

services:
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
    restart: always

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  app:
    build: ./app
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://admin:\${POSTGRES_PASSWORD}@postgres/mydb
      REDIS_URL: redis://redis:6379
    depends_on: [postgres, redis]
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
`

export default function ComposeEditor() {
  const [content, setContent] = useState(DEFAULT_COMPOSE)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem('dd_compose', content)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCopy = () => navigator.clipboard.writeText(content)

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'docker-compose.yml'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Compose editor" />
      <div style={{ flex: 1, display: 'flex', gap: 12, padding: 20, minHeight: 0 }}>
        {/* Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ background: '#141927', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: '10px 10px 0 0', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>docker-compose.yml</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
              {[['Copy', handleCopy],['Download', handleDownload],[saved ? 'Saved ✓' : 'Save', handleSave]].map(([label, fn]) => (
                <button key={label} onClick={fn} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.1)', background: label === (saved ? 'Saved ✓' : 'Save') ? 'rgba(66,211,165,0.15)' : 'transparent', color: label === (saved ? 'Saved ✓' : 'Save') ? '#42d3a5' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            spellCheck={false}
            style={{ flex: 1, background: '#0a0e17', color: '#c9d1d9', fontFamily: "'Cascadia Code','Fira Code',monospace", fontSize: 13, lineHeight: 1.75, padding: 14, border: '0.5px solid rgba(255,255,255,0.06)', borderTop: 'none', borderRadius: '0 0 10px 10px', resize: 'none', outline: 'none' }}
          />
        </div>

        {/* Side panel */}
        <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Quick commands</div>
            {[
              'docker compose up -d',
              'docker compose down',
              'docker compose ps',
              'docker compose logs -f',
              'docker compose pull',
              'docker compose restart',
            ].map(cmd => (
              <div key={cmd} onClick={() => navigator.clipboard.writeText(cmd)} title="Click to copy" style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)', padding: '5px 0', borderBottom: '0.5px solid var(--border)', cursor: 'copy' }}>
                {cmd}
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Tips</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Use <code style={{ background: 'var(--surface-0)', padding: '1px 4px', borderRadius: 3 }}>.env</code> for secrets. Never commit passwords to git.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
