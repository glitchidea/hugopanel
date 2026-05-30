import { create } from 'zustand'
import type { Repository } from '@/types/repo'

interface RepoState {
  repositories: Repository[]
  selectedRepo: Repository | null
  isLoading: boolean
  setRepositories: (repos: Repository[]) => void
  setSelectedRepo: (repo: Repository | null) => void
  updateRepo: (id: string, updates: Partial<Repository>) => void
  addRepo: (repo: Repository) => void
  removeRepo: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useRepoStore = create<RepoState>()((set) => ({
  repositories: [],
  selectedRepo: null,
  isLoading: false,

  setRepositories: (repos) => set({ repositories: repos }),

  setSelectedRepo: (repo) => set({ selectedRepo: repo }),

  updateRepo: (id, updates) =>
    set((state) => ({
      repositories: state.repositories.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      selectedRepo: state.selectedRepo?.id === id
        ? { ...state.selectedRepo, ...updates }
        : state.selectedRepo,
    })),

  addRepo: (repo) =>
    set((state) => ({ repositories: [repo, ...state.repositories] })),

  removeRepo: (id) =>
    set((state) => ({
      repositories: state.repositories.filter((r) => r.id !== id),
      selectedRepo: state.selectedRepo?.id === id ? null : state.selectedRepo,
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}))
