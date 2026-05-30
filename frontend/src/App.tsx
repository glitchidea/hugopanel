import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { AppShell } from '@/components/layout/AppShell'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ReposPage from '@/pages/repos/ReposPage'
import PostsPage from '@/pages/posts/PostsPage'
import PostEditorPage from '@/pages/posts/PostEditorPage'
import SettingsPage from '@/pages/settings/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="repos" element={<ReposPage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="posts/new" element={<PostEditorPage />} />
        <Route path="posts/edit" element={<PostEditorPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
