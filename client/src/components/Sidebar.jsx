const NAV = [
  { section: 'Overview' },
  { id: 'containers', label: 'Containers',      icon: '▣' },
  { id: 'images',     label: 'Images',          icon: '◧' },
  { section: 'Storage' },
  { id: 'volumes',    label: 'Volumes',         icon: '◫' },
  { id: 'networks',   label: 'Networks',        icon: '◈' },
  { section: 'Tools' },
  { id: 'terminal',   label: 'Terminal',        icon: '>' },
  { id: 'alerts',     label: 'Alerts',          icon: '⚑', badge: 'alerts' },
  { id: 'compose',    label: 'Compose editor',  icon: '≡' },
  { section: 'System' },
  { id: 'resources',  label: 'Resource usage',  icon: '▸' },
]

export default function Sidebar({ active, onNavigate, user, onLogout, alertCount }) {
  return (
    <nav style={styles.sidebar} aria-label="Dashboard navigation">
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.logo}>🐳</div>
        <div>
          <div style={styles.brandTitle}>Docker Dashboard</div>
          <div style={styles.brandSub}>Ubuntu 22.04 LTS</div>
        </div>
      </div>

      {/* Nav items */}
      <div style={styles.nav}>
        {NAV.map((item, i) => {
          if (item.section) {
            return <div key={i} style={styles.section}>{item.section}</div>
          }
          const isActive = active === item.id
          const badgeNum = item.badge === 'alerts' ? alertCount : 0
          return (
            <button
              key={item.id}
              style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badgeNum > 0 && (
                <span style={styles.alertBadge}>{badgeNum}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* User footer */}
      <div style={styles.footer}>
        <div style={styles.userRow}>
          <div style={styles.avatar}>{(user?.username?.[0] ?? 'U').toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.username}>{user?.username ?? 'admin'}</div>
            <div style={styles.userRole}>{user?.role ?? 'admin'}</div>
          </div>
          <button style={styles.logoutBtn} onClick={onLogout} title="Log out">⏻</button>
        </div>
      </div>
    </nav>
  )
}

const styles = {
  sidebar:      { width: 220, background: '#1a1f2e', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh' },
  brand:        { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid rgba(255,255,255,0.07)' },
  logo:         { width: 28, height: 28, borderRadius: 6, background: '#42d3a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  brandTitle:   { fontSize: 13, fontWeight: 500, color: '#fff' },
  brandSub:     { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  nav:          { flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' },
  section:      { fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.28)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '10px 8px 4px' },
  navItem:      { display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 6, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all .12s' },
  navItemActive:{ background: 'rgba(66,211,165,0.15)', color: '#42d3a5' },
  navIcon:      { width: 16, fontSize: 14, flexShrink: 0, textAlign: 'center' },
  alertBadge:   { background: 'rgba(226,75,74,0.25)', color: '#f5a09f', fontSize: 10, padding: '1px 5px', borderRadius: 8 },
  footer:       { padding: 10, borderTop: '0.5px solid rgba(255,255,255,0.07)' },
  userRow:      { display: 'flex', alignItems: 'center', gap: 8, padding: 7, borderRadius: 6 },
  avatar:       { width: 26, height: 26, borderRadius: '50%', background: '#42d3a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#0b3a2e', flexShrink: 0 },
  username:     { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 },
  userRole:     { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  logoutBtn:    { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 16, cursor: 'pointer', padding: 3, borderRadius: 4 },
}
