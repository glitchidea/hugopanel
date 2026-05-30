import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface ProfileFormData {
  username: string
  git_author_name: string
  git_author_email: string
  default_commit_template: string
  default_branch: string
  default_content_path: string
}

function profileDefaults(user: ReturnType<typeof useAuthStore.getState>['user']): ProfileFormData {
  return {
    username: user?.username || '',
    git_author_name: user?.git_author_name || '',
    git_author_email: user?.git_author_email || '',
    default_commit_template: user?.default_commit_template || 'feat: {action} {file}',
    default_branch: user?.default_branch || 'main',
    default_content_path: user?.default_content_path || 'content/',
  }
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuthStore()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    defaultValues: profileDefaults(user),
  })

  useEffect(() => {
    profileForm.reset(profileDefaults(user))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const passwordForm = useForm<{ old_password: string; new_password: string; new_password2: string }>()

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setIsUpdating(true)
    try {
      const updated = await authService.updateProfile(data)
      updateUser(updated)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePasswordChange = async (data: { old_password: string; new_password: string; new_password2: string }) => {
    if (data.new_password !== data.new_password2) {
      toast.error('Passwords do not match')
      return
    }
    setIsChangingPassword(true)
    try {
      await authService.changePassword(data.old_password, data.new_password, data.new_password2)
      toast.success('Password changed')
      passwordForm.reset()
    } catch {
      toast.error('Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await authService.deleteAccount()
      logout()
      navigate('/login')
      toast.success('Account deleted')
    } catch {
      toast.error('Failed to delete account')
    }
  }

  return (
    <div className="settings-page animate-fade-in">
      <header className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <p className="settings-desc">Profile, Git identity, and publishing defaults</p>
      </header>

      <section className="settings-section">
        <h3 className="settings-section-title">Profile</h3>
        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="form-stack">
          <div>
            <label className="label">Email</label>
            <input className="input input-minimal input-disabled" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="label" htmlFor="settings-username">Username</label>
            <input
              id="settings-username"
              className="input input-minimal"
              {...profileForm.register('username', { required: true, minLength: 3 })}
            />
          </div>
          <button type="submit" className="btn-primary settings-submit" disabled={isUpdating}>
            {isUpdating ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h3 className="settings-section-title">Git & publishing</h3>
        <p className="settings-hint">
          Stored in your account. Server defaults apply only when a field is left empty.
        </p>
        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="form-stack">
          <div>
            <label className="label" htmlFor="settings-git-name">Author name</label>
            <input
              id="settings-git-name"
              className="input input-minimal"
              placeholder="Jane Doe"
              {...profileForm.register('git_author_name')}
            />
          </div>
          <div>
            <label className="label" htmlFor="settings-git-email">Author email</label>
            <input
              id="settings-git-email"
              type="email"
              className="input input-minimal"
              placeholder="jane@example.com"
              {...profileForm.register('git_author_email')}
            />
          </div>
          <div>
            <label className="label" htmlFor="settings-commit-template">
              Commit template <span className="label-hint">{'{action}'} · {'{file}'}</span>
            </label>
            <input
              id="settings-commit-template"
              className="input input-minimal input-mono"
              {...profileForm.register('default_commit_template', { required: true, minLength: 3 })}
            />
          </div>
          <div className="form-row-2">
            <div>
              <label className="label" htmlFor="settings-branch">Default branch</label>
              <input id="settings-branch" className="input input-minimal" {...profileForm.register('default_branch', { required: true })} />
            </div>
            <div>
              <label className="label" htmlFor="settings-content-path">Content path</label>
              <input
                id="settings-content-path"
                className="input input-minimal input-mono"
                {...profileForm.register('default_content_path', { required: true })}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary settings-submit" disabled={isUpdating}>
            {isUpdating ? 'Saving…' : 'Save preferences'}
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h3 className="settings-section-title">Password</h3>
        <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="form-stack">
          <div>
            <label className="label" htmlFor="settings-old-pw">Current password</label>
            <input
              id="settings-old-pw"
              type="password"
              className="input input-minimal"
              {...passwordForm.register('old_password', { required: true })}
            />
          </div>
          <div className="form-row-2">
            <div>
              <label className="label" htmlFor="settings-new-pw">New password</label>
              <input
                id="settings-new-pw"
                type="password"
                className="input input-minimal"
                {...passwordForm.register('new_password', { required: true, minLength: 8 })}
              />
            </div>
            <div>
              <label className="label" htmlFor="settings-new-pw2">Confirm</label>
              <input
                id="settings-new-pw2"
                type="password"
                className="input input-minimal"
                {...passwordForm.register('new_password2', { required: true })}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary settings-submit" disabled={isChangingPassword}>
            {isChangingPassword ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </section>

      <section className="settings-section settings-section-danger">
        <h3 className="settings-section-title settings-section-title-danger">Account</h3>
        <p className="settings-hint">
          Permanently delete your account and disconnect all repositories.
        </p>
        {!showDeleteConfirm ? (
          <button type="button" onClick={() => setShowDeleteConfirm(true)} className="btn-text btn-text-danger">
            Delete account
          </button>
        ) : (
          <div className="settings-delete-confirm">
            <p>Are you sure? This cannot be undone.</p>
            <div className="settings-delete-actions">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn-text">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteAccount} className="btn-text btn-text-danger">
                Yes, delete
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
