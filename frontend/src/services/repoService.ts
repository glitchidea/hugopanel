import api from './api'
import type { Repository, CreateRepositoryRequest, FileTreeItem, AuditLog } from '@/types/repo'

export const repoService = {
  async list(): Promise<Repository[]> {
    const res = await api.get('/repos/')
    return res.data.data
  },

  async get(id: string): Promise<Repository> {
    const res = await api.get(`/repos/${id}/`)
    return res.data.data
  },

  async create(data: CreateRepositoryRequest): Promise<Repository> {
    const res = await api.post('/repos/', data)
    return res.data.data
  },

  async update(id: string, data: Partial<CreateRepositoryRequest>): Promise<Repository> {
    const res = await api.patch(`/repos/${id}/`, data)
    return res.data.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/repos/${id}/`)
  },

  async sync(id: string): Promise<{ message: string }> {
    const res = await api.post(`/repos/${id}/sync/`)
    return res.data.data
  },

  async testConnection(id: string): Promise<{ connected: boolean }> {
    const res = await api.post(`/repos/${id}/test-connection/`)
    return res.data.data
  },

  async getBranches(id: string): Promise<string[]> {
    const res = await api.get(`/repos/${id}/branches/`)
    return res.data.data
  },

  async getTree(id: string): Promise<FileTreeItem[]> {
    const res = await api.get(`/repos/${id}/tree/`)
    return res.data.data
  },

  async getAuditLogs(id: string): Promise<AuditLog[]> {
    const res = await api.get(`/repos/${id}/audit-logs/`)
    return res.data.data
  },
}
