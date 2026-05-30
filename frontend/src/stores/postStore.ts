import { create } from 'zustand'
import type { PostSummary, PostFilters } from '@/types/post'

interface PostState {
  posts: PostSummary[]
  filters: PostFilters
  totalCount: number
  isLoading: boolean
  setPosts: (posts: PostSummary[], count: number) => void
  setFilters: (filters: Partial<PostFilters>) => void
  resetFilters: () => void
  setLoading: (loading: boolean) => void
}

const defaultFilters: PostFilters = {
  search: '',
  status: '',
  section: '',
  sort: 'date',
  page: 1,
}

export const usePostStore = create<PostState>()((set) => ({
  posts: [],
  filters: defaultFilters,
  totalCount: 0,
  isLoading: false,

  setPosts: (posts, count) => set({ posts, totalCount: count }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters, page: filters.page ?? 1 },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  setLoading: (loading) => set({ isLoading: loading }),
}))
