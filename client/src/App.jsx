import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Containers from './components/Containers.jsx'
import Images from './components/Images.jsx'
import Volumes from './components/Volumes.jsx'
import Networks from './components/Networks.jsx'
import Terminal from './components/Terminal.jsx'
import Alerts from './components/Alerts.jsx'
import ComposeEditor from './components/ComposeEditor.jsx'
import Resources from './components/Resources.jsx'
import Login from './components/Login.jsx'
import { useDockerStats } from './hooks/useDockerStats.js'
import { useDockerEvents } from './hooks/useDockerEvents.js'
import { auth } from './utils/api.js'

const PAGES = {
  containers:  { label: 'Containers',     component: Containers },
  images:      { label: 'Images',         component: Images },
  volumes:     { label: 'Volumes',        component: Volumes },
  networks:    { label: 'Networks',       component: Networks },
  terminal:    { label: 'Terminal',       component: Terminal },
  alerts:      { label: 'Alerts',        component: Alerts },
  compose:     { label: 'Compose editor', component: ComposeEditor },
  resources:   { label: 'Resource usage', component: Resources },
}

export default function App() {
  const [page, setPage] = useState('containers')
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  const stats  = useDockerStats()
  const events = useDockerEvents(100)

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('dd_token')
    if (!token) { setChecking(false); return }
    auth.me()
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('dd_token'))
      .finally(() => setChecking(false))
  }, [])

  const handleLogin = (token, userData) => {
    localStorage.setItem('dd_token', token)
    setUser(userData)
  }

  const handleLogout = () => {
    auth.logout().finally(() => {
      localStorage.removeItem('dd_token')
      setUser(null)
    })
  }

  if (checking) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-muted)' }}>
      Loading…
    </div>
  )

  if (!user) return <Login onLogin={handleLogin} />

  const PageComponent = PAGES[page]?.component ?? Containers
  const newAlerts = events.filter(e => ['die','oom','kill'].includes(e.Action)).length

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar
        active={page}
        onNavigate={setPage}
        user={user}
        onLogout={handleLogout}
        alertCount={newAlerts}
      />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--surface-0)' }}>
        <PageComponent
          stats={stats}
          events={events}
          onNavigate={setPage}
        />
      </main>
    </div>
  )
}
