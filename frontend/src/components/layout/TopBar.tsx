import { useLocation } from 'react-router-dom'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/repos': 'Repositories',
  '/posts': 'Posts',
  '/settings': 'Settings',
}

export function TopBar() {
  const location = useLocation()

  const title = Object.entries(routeTitles).find(([path]) =>
    location.pathname.startsWith(path),
  )?.[1] || 'HugoPanel'

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
    </header>
  )
}
