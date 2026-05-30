import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { repoService } from '@/services/repoService'
import { useRepoStore } from '@/stores/repoStore'
import { useAuthStore } from '@/stores/authStore'
import { formatDistanceToNow } from 'date-fns'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { setRepositories, setSelectedRepo } = useRepoStore()

  const { data: repos = [], isLoading } = useQuery({
    queryKey: ['repos'],
    queryFn: repoService.list,
  })

  useEffect(() => {
    if (repos.length > 0) {
      setRepositories(repos)
    }
  }, [repos, setRepositories])

  const totalPosts = repos.reduce((acc, r) => acc + (r.post_count || 0), 0)
  const clonedCount = repos.filter((r) => r.is_cloned).length

  return (
    <div className="dashboard-page animate-fade-in">
      <header className="dashboard-header">
        <p className="dashboard-greeting">{getGreeting()}, {user?.username}</p>
        <h2 className="dashboard-title">Overview</h2>
      </header>

      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{isLoading ? '—' : repos.length}</span>
          <span className="dashboard-stat-label">Repositories</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{isLoading ? '—' : totalPosts}</span>
          <span className="dashboard-stat-label">Posts</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{isLoading ? '—' : clonedCount}</span>
          <span className="dashboard-stat-label">Cloned</span>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/posts/new" className="btn-primary">New post</Link>
        <Link to="/repos" className="btn-text dashboard-action-link">Connect repository</Link>
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <h3 className="dashboard-section-title">Repositories</h3>
          {repos.length > 0 && (
            <Link to="/repos" className="btn-text">View all</Link>
          )}
        </div>

        {isLoading ? (
          <div className="dashboard-loading">
            <div className="spinner" />
            <span>Loading…</span>
          </div>
        ) : repos.length === 0 ? (
          <div className="dashboard-empty">
            <p className="dashboard-empty-title">No repositories yet</p>
            <p className="dashboard-empty-desc">Connect a Hugo repository to start managing posts.</p>
            <Link to="/repos" className="btn-primary">Connect repository</Link>
          </div>
        ) : (
          <ul className="dashboard-repo-list">
            {repos.slice(0, 5).map((repo) => (
              <li key={repo.id} className="dashboard-repo-item">
                <button
                  type="button"
                  className="dashboard-repo-main"
                  onClick={() => setSelectedRepo(repo)}
                >
                  <span className="dashboard-repo-name">{repo.display_name}</span>
                  <span className="dashboard-repo-meta">
                    {repo.post_count ?? 0} posts
                    {repo.last_synced && (
                      <> · synced {formatDistanceToNow(new Date(repo.last_synced), { addSuffix: true })}</>
                    )}
                    {repo.is_syncing && <> · syncing</>}
                  </span>
                </button>
                <Link
                  to={`/posts?repo=${repo.id}`}
                  className="btn-text"
                  onClick={() => setSelectedRepo(repo)}
                >
                  Posts
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
