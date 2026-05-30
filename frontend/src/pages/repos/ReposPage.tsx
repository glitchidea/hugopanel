import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repoService } from '@/services/repoService'
import { useRepoStore } from '@/stores/repoStore'
import { useAuthStore } from '@/stores/authStore'
import type { CreateRepositoryRequest, Provider } from '@/types/repo'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

function ConnectModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CreateRepositoryRequest>({
    defaultValues: {
      provider: 'github',
      default_branch: user?.default_branch || 'main',
      content_path: user?.default_content_path || 'content/',
    },
  })

  const createMutation = useMutation({
    mutationFn: repoService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] })
      toast.success('Repository connected')
      onClose()
    },
    onError: (err: Error) => {
      toast.error(
        (err as unknown as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Failed to connect',
      )
    },
  })

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-panel modal-panel-wide animate-fade-in">
        <h3 className="modal-title">Connect repository</h3>
        <p className="modal-desc">Link a Hugo repository with an HTTPS access token.</p>

        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="form-stack">
          <div>
            <label className="label">Provider</label>
            <div className="provider-row">
              {(['github', 'gitlab', 'gitea'] as Provider[]).map((p) => (
                <label
                  key={p}
                  className={`provider-option ${watch('provider') === p ? 'provider-option-active' : ''}`}
                >
                  <input type="radio" value={p} {...register('provider')} className="sr-only" />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="repo-display-name">Display name</label>
            <input
              id="repo-display-name"
              className="input input-minimal"
              placeholder="My Blog"
              {...register('display_name', { required: 'Required' })}
            />
            {errors.display_name && <p className="field-error">{errors.display_name.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="repo-name">Repository (owner/repo)</label>
            <input
              id="repo-name"
              className="input input-minimal"
              placeholder="glitchidea/blog"
              {...register('name', { required: 'Required' })}
            />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="repo-clone-url">Clone URL</label>
            <input
              id="repo-clone-url"
              className="input input-minimal"
              placeholder="https://github.com/glitchidea/blog.git"
              {...register('clone_url', { required: 'Required' })}
            />
            {errors.clone_url && <p className="field-error">{errors.clone_url.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="repo-token">Access token</label>
            <input
              id="repo-token"
              type="password"
              className="input input-minimal"
              placeholder="ghp_…"
              {...register('access_token', {
                required: 'Required',
                minLength: { value: 20, message: 'Min 20 characters' },
              })}
            />
            {errors.access_token && <p className="field-error">{errors.access_token.message}</p>}
          </div>

          <div className="form-row-2">
            <div>
              <label className="label" htmlFor="repo-branch">Branch</label>
              <input id="repo-branch" className="input input-minimal" {...register('default_branch', { required: true })} />
            </div>
            <div>
              <label className="label" htmlFor="repo-content-path">Content path</label>
              <input
                id="repo-content-path"
                className="input input-minimal"
                {...register('content_path', {
                  required: 'Required',
                  validate: (v) => v.endsWith('/') || "Must end with '/'",
                })}
              />
              {errors.content_path && <p className="field-error">{errors.content_path.message}</p>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-text">Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ReposPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const { setRepositories, setSelectedRepo } = useRepoStore()

  const { data: repos = [], isLoading } = useQuery({
    queryKey: ['repos'],
    queryFn: repoService.list,
    refetchInterval: (query) => {
      const data = query.state.data || []
      return data.some((r) => r.is_syncing) ? 3000 : false
    },
  })

  useEffect(() => {
    setRepositories(repos)
  }, [repos, setRepositories])

  const syncMutation = useMutation({
    mutationFn: repoService.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] })
      toast.success('Sync started')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: repoService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] })
      toast.success('Repository disconnected')
    },
  })

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Disconnect "${name}"? The local clone will be removed.`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="repos-page animate-fade-in">
      {showModal && <ConnectModal onClose={() => setShowModal(false)} />}

      <header className="repos-header">
        <div>
          <h2 className="repos-title">Repositories</h2>
          <p className="repos-count">{isLoading ? '—' : `${repos.length} connected`}</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="btn-primary">
          Connect
        </button>
      </header>

      {isLoading ? (
        <div className="repos-loading">
          <div className="spinner" />
          <span>Loading…</span>
        </div>
      ) : repos.length === 0 ? (
        <div className="repos-empty">
          <p className="repos-empty-title">No repositories yet</p>
          <p className="repos-empty-desc">Connect a Hugo repository to manage posts from here.</p>
          <button type="button" onClick={() => setShowModal(true)} className="btn-primary">
            Connect repository
          </button>
        </div>
      ) : (
        <ul className="repos-list">
          {repos.map((repo) => (
            <li key={repo.id} className="repos-item">
              <button
                type="button"
                className="repos-item-main"
                onClick={() => setSelectedRepo(repo)}
              >
                <div className="repos-item-head">
                  <span className="repos-item-name">{repo.display_name}</span>
                  <span className={`repos-item-status ${repo.is_cloned ? 'repos-item-status-ok' : ''}`}>
                    {repo.is_syncing ? 'Syncing' : repo.is_cloned ? 'Ready' : 'Not cloned'}
                  </span>
                </div>
                <span className="repos-item-meta">
                  {repo.name}
                  {' · '}
                  {repo.provider}
                  {' · '}
                  {repo.default_branch}
                  {repo.post_count != null && <> · {repo.post_count} posts</>}
                  {repo.last_synced && (
                    <> · synced {formatDistanceToNow(new Date(repo.last_synced), { addSuffix: true })}</>
                  )}
                </span>
              </button>
              <div className="repos-item-actions">
                <button
                  type="button"
                  className="btn-text"
                  disabled={repo.is_syncing || syncMutation.isPending}
                  onClick={() => syncMutation.mutate(repo.id)}
                >
                  {repo.is_syncing ? 'Syncing…' : 'Sync'}
                </button>
                <button
                  type="button"
                  className="btn-text btn-text-danger"
                  onClick={() => handleDelete(repo.id, repo.display_name)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
