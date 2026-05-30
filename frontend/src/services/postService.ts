import api from './api'
import type { PostSummary, PostDetail, CreatePostRequest, UpdatePostRequest, PostFilters, PostListMeta } from '@/types/post'

export const postService = {
  async list(
    repoId: string,
    filters?: PostFilters
  ): Promise<{ posts: PostSummary[]; meta: PostListMeta }> {
    const res = await api.get(`/repos/${repoId}/posts/`, { params: filters })
    return {
      posts: res.data.data,
      meta: res.data.meta,
    }
  },

  async get(repoId: string, filePath: string): Promise<PostDetail> {
    const encoded = encodeURIComponent(filePath)
    const res = await api.get(`/repos/${repoId}/posts/${encoded}/`)
    return res.data.data
  },

  async create(repoId: string, data: CreatePostRequest): Promise<{ path: string; commit_sha: string }> {
    const res = await api.post(`/repos/${repoId}/posts/`, data)
    return res.data.data
  },

  async update(repoId: string, filePath: string, data: UpdatePostRequest): Promise<{ path: string; commit_sha: string }> {
    const encoded = encodeURIComponent(filePath)
    const res = await api.put(`/repos/${repoId}/posts/${encoded}/`, data)
    return res.data.data
  },

  async delete(repoId: string, filePath: string, commitMessage: string, branch?: string): Promise<{ path: string; commit_sha: string }> {
    const encoded = encodeURIComponent(filePath)
    const res = await api.delete(`/repos/${repoId}/posts/${encoded}/`, {
      data: { commit_message: commitMessage, branch },
    })
    return res.data.data
  },
}
