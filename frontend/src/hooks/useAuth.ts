import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'
import type { LoginRequest, RegisterRequest } from '@/types/auth'

export function useAuth() {
  const navigate = useNavigate()
  const { user, isAuthenticated, setAuth, updateUser, logout: storeLogout } = useAuthStore()

  const login = async (data: LoginRequest) => {
    const res = await authService.login(data)
    setAuth(res.user, res.access, res.refresh)
    toast.success(`Welcome back, ${res.user.username}!`)
    navigate('/dashboard')
  }

  const register = async (data: RegisterRequest) => {
    await authService.register(data)
    toast.success('Account created! Please log in.')
    navigate('/login')
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    } catch {
      // ignore
    }
    storeLogout()
    navigate('/login')
  }

  return { user, isAuthenticated, login, register, logout, updateUser }
}
