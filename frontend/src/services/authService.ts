import api from './api'
import type { LoginRequest, RegisterRequest, LoginResponse, User } from '@/types/auth'

export const authService = {
  async register(data: RegisterRequest): Promise<User> {
    const res = await api.post('/auth/register/', data)
    return res.data.data
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await api.post('/auth/login/', data)
    return res.data.data
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout/', { refresh: refreshToken })
  },

  async getProfile(): Promise<User> {
    const res = await api.get('/auth/me/')
    return res.data.data
  },

  async updateProfile(
    data: Partial<
      Pick<
        User,
        | 'username'
        | 'default_commit_template'
        | 'default_branch'
        | 'default_content_path'
        | 'git_author_name'
        | 'git_author_email'
      >
    >,
  ): Promise<User> {
    const res = await api.patch('/auth/me/', data)
    return res.data.data
  },

  async changePassword(oldPassword: string, newPassword: string, newPassword2: string): Promise<void> {
    await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword2,
    })
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/auth/me/delete/')
  },
}
