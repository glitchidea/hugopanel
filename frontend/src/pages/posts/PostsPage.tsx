import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRepoStore } from '@/stores/repoStore'
import { usePosts, useDeletePost } from '@/hooks/usePosts'
import type { PostFilters, PostSummary } from '@/types/post'

function DeleteModal({
  post,
  onClose,
  onConfirm,
  isLoading,
}: {
  post: PostSummary
  onClose: () => void
  onConfirm: (commitMsg: string) => void
  isLoading: boolean
}) {
  const [commitMsg, setCommitMsg] = useState(`chore: delete ${post.title}`)

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-panel animate-fade-in">
        <h3 className="modal-title">Delete post</h3>
        <p className="modal-desc">
          This will commit a deletion to your repository. This action cannot be undone.
        </p>
        <div className="modal-preview">
          <div className="modal-preview-title">{post.title}</div>
          <div className="modal-preview-path">{post.path}</div>
        </div>
        <label className="label" htmlFor="delete-commit-msg">Commit message</label>
        <input
          id="delete-commit-msg"
          className="input"
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
        />
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-text">Cancel</button>
          <button
            type="button"
            onClick={() => onConfirm(commitMsg)}
            disabled={isLoading}
            className="btn-text btn-text-danger"
          >
            {isLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusDot({ draft }: { draft: boolean }) {
  return (
    <span className={`post-status ${draft ? 'post-status-draft' : 'post-status-published'}`}>
      {draft ? 'Draft' : 'Published'}
    </span>
  )
}

export default function PostsPage() {
  const navigate = useNavigate()
  const { selectedRepo } = useRepoStore()
  const [filters, setFilters] = useState<PostFilters>({ sort: 'date', page: 1 })
  const [deleteTarget, setDeleteTarget] = useState<PostSummary | null>(null)

  const { data, isLoading, refetch } = usePosts(selectedRepo?.id || '', filters)
  const deleteMutation = useDeletePost(selectedRepo?.id || '')

  const posts = data?.posts || []
  const meta = data?.meta

  const handleDelete = (commitMsg: string) => {
    if (!deleteTarget) return
    deleteMutation.mutate(
      { filePath: deleteTarget.path, commitMessage: commitMsg },
      { onSuccess: () => setDeleteTarget(null) },
    )
  }

  if (!selectedRepo) {
    return (
      <div className="posts-page animate-fade-in">
        <div className="posts-empty">
          <p className="posts-empty-title">No repository selected</p>
          <p className="posts-empty-desc">Select a repository from the sidebar to view posts.</p>
          <Link to="/repos" className="btn-primary posts-empty-action">Repositories</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="posts-page animate-fade-in">
      {deleteTarget && (
        <DeleteModal
          post={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      )}

      <header className="posts-header">
        <div>
          <p className="posts-repo">{selectedRepo.display_name}</p>
          <h2 className="posts-title">Posts</h2>
          <p className="posts-count">{meta?.count ?? 0} articles</p>
        </div>
        <div className="posts-header-actions">
          <button type="button" onClick={() => refetch()} className="btn-text">
            Refresh
          </button>
          <Link to={`/posts/new?repo=${selectedRepo.id}`} className="btn-primary">
            New post
          </Link>
        </div>
      </header>

      <div className="posts-toolbar">
        <input
          className="input posts-search"
          placeholder="Search…"
          value={filters.search || ''}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
        />
        <select
          className="input posts-filter"
          value={filters.status || ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as PostFilters['status'], page: 1 }))}
        >
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          className="input posts-filter"
          value={filters.sort || 'date'}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as PostFilters['sort'] }))}
        >
          <option value="date">Newest</option>
          <option value="title">Title</option>
          <option value="modified">Modified</option>
        </select>
      </div>

      {isLoading ? (
        <div className="posts-loading">
          <div className="spinner" />
          <span>Loading posts…</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="posts-empty">
          <p className="posts-empty-title">
            {filters.search ? 'No matching posts' : 'No posts yet'}
          </p>
          <p className="posts-empty-desc">
            {filters.search
              ? 'Try a different search term.'
              : 'Create your first post for this repository.'}
          </p>
          {!filters.search && (
            <Link to={`/posts/new?repo=${selectedRepo.id}`} className="btn-primary posts-empty-action">
              New post
            </Link>
          )}
        </div>
      ) : (
        <ul className="posts-list">
          {posts.map((post) => (
            <li key={post.path} className="post-item">
              <button
                type="button"
                className="post-item-main"
                onClick={() =>
                  navigate(`/posts/edit?repo=${selectedRepo.id}&path=${encodeURIComponent(post.path)}`)
                }
              >
                <div className="post-item-head">
                  <h3 className="post-item-title">
                    {post.title || post.path.split('/').pop()}
                  </h3>
                  <StatusDot draft={post.draft} />
                </div>
                {post.description && (
                  <p className="post-item-desc">{post.description}</p>
                )}
                <div className="post-item-meta">
                  {post.date && <span>{post.date.substring(0, 10)}</span>}
                  {post.tags.length > 0 && (
                    <span className="post-item-tags">
                      {post.tags.slice(0, 3).join(' · ')}
                      {post.tags.length > 3 && ` +${post.tags.length - 3}`}
                    </span>
                  )}
                  <span className="post-item-path">{post.path}</span>
                </div>
              </button>
              <div className="post-item-actions">
                <button
                  type="button"
                  className="btn-text"
                  onClick={() =>
                    navigate(`/posts/edit?repo=${selectedRepo.id}&path=${encodeURIComponent(post.path)}`)
                  }
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-text btn-text-danger"
                  onClick={() => setDeleteTarget(post)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {meta && meta.total_pages > 1 && (
        <nav className="posts-pagination" aria-label="Pagination">
          {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, page }))}
              className={page === (filters.page || 1) ? 'posts-page-btn posts-page-btn-active' : 'posts-page-btn'}
            >
              {page}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
