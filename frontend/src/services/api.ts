import axios, { AxiosError } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor — attach access token ─────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — refresh on 401 ────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest?.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return api(originalRequest!)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        isRefreshing = false
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh: refreshToken })
        const newAccessToken = res.data.data?.access || res.data.access
        localStorage.setItem('access_token', newAccessToken)
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
        processQueue(null, newAccessToken)
        if (originalRequest?.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        return api(originalRequest!)
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
