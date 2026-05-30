import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useRepoStore } from '@/stores/repoStore'
import { authService } from '@/services/authService'
import { clsx } from 'clsx'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/repos', label: 'Repositories' },
  { to: '/posts', label: 'Posts' },
  { to: '/settings', label: 'Settings' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { repositories, selectedRepo, setSelectedRepo } = useRepoStore()

  const handleLogout = async () => {
    try {
      const rt = localStorage.getItem('refresh_token')
      if (rt) await authService.logout(rt)
    } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-text">HugoPanel</span>
      </div>

      {repositories.length > 0 && (
        <div className="sidebar-repo">
          <label className="sidebar-label" htmlFor="sidebar-repo-select">Repository</label>
          <select
            id="sidebar-repo-select"
            value={selectedRepo?.id || ''}
            onChange={(e) => {
              const repo = repositories.find((r) => r.id === e.target.value)
              setSelectedRepo(repo || null)
            }}
            className="sidebar-select"
          >
            <option value="">Select repository</option>
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav className="sidebar-nav">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx('sidebar-link', { 'sidebar-link-active': isActive })}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-user-name">{user?.username}</span>
          <span className="sidebar-user-email">{user?.email}</span>
        </div>
        <button type="button" onClick={handleLogout} className="sidebar-signout">
          Sign out
        </button>
      </div>
    </aside>
  )
}
