import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postService } from '@/services/postService'
import type { PostFilters, CreatePostRequest, UpdatePostRequest } from '@/types/post'
import toast from 'react-hot-toast'

export function usePosts(repoId: string, filters?: PostFilters) {
  return useQuery({
    queryKey: ['posts', repoId, filters],
    queryFn: () => postService.list(repoId, filters),
    enabled: !!repoId,
  })
}

export function usePost(repoId: string, filePath: string | undefined) {
  return useQuery({
    queryKey: ['post', repoId, filePath],
    queryFn: () => postService.get(repoId, filePath!),
    enabled: !!repoId && !!filePath,
  })
}

export function useCreatePost(repoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePostRequest) => postService.create(repoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', repoId] })
      toast.success('Post created and committed!')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create post')
    },
  })
}

export function useUpdatePost(repoId: string, filePath: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdatePostRequest) => postService.update(repoId, filePath, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', repoId] })
      queryClient.invalidateQueries({ queryKey: ['post', repoId, filePath] })
      toast.success('Post saved and pushed!')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save post')
    },
  })
}

export function useDeletePost(repoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ filePath, commitMessage, branch }: { filePath: string; commitMessage: string; branch?: string }) =>
      postService.delete(repoId, filePath, commitMessage, branch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', repoId] })
      toast.success('Post deleted and committed!')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete post')
    },
  })
}
