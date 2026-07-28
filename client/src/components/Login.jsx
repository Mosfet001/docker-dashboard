import { useState } from 'react'
import { auth } from '../utils/api.js'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await auth.login(username, password)
      onLogin(res.data.token, { username: res.data.username })
    } catch (err) {
      setError(err.response?.data?.error ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🐳</div>
        <h1 style={s.title}>Docker Dashboard</h1>
        <p style={s.sub}>Sign in to manage your containers</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Username</label>
          <input
            style={s.input}
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="admin"
            autoFocus
            required
          />
          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={s.hint}>Default: admin / changeme — change in <code>.env</code></p>
      </div>
    </div>
  )
}

const s = {
  page:  { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--surface-0)' },
  card:  { background: 'var(--surface-2)', border: '0.5px solid var(--border)', borderRadius: 16, padding: '36px 32px', width: 360, textAlign: 'center' },
  logo:  { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 500, marginBottom: 6 },
  sub:   { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 },
  error: { background: 'var(--bg-danger)', color: 'var(--text-danger)', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 16 },
  form:  { display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' },
  input: { border: '0.5px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', fontSize: 14, background: 'var(--surface-1)', color: 'var(--text-primary)', outline: 'none', width: '100%' },
  btn:   { marginTop: 8, padding: '10px 0', background: '#42d3a5', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#0b3a2e', cursor: 'pointer', width: '100%' },
  hint:  { marginTop: 20, fontSize: 11, color: 'var(--text-muted)' },
}
