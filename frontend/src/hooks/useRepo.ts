import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repoService } from '@/services/repoService'
import type { CreateRepositoryRequest } from '@/types/repo'
import toast from 'react-hot-toast'

export function useRepos() {
  const queryClient = useQueryClient()

  const repos = useQuery({
    queryKey: ['repos'],
    queryFn: repoService.list,
  })

  const createRepo = useMutation({
    mutationFn: (data: CreateRepositoryRequest) => repoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] })
      toast.success('Repository connected! Cloning in background...')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to connect repository')
    },
  })

  const deleteRepo = useMutation({
    mutationFn: (id: string) => repoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] })
      toast.success('Repository disconnected')
    },
  })

  const syncRepo = useMutation({
    mutationFn: (id: string) => repoService.sync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] })
      toast.success('Sync started!')
    },
  })

  return { repos, createRepo, deleteRepo, syncRepo }
}

export function useRepo(id: string) {
  return useQuery({
    queryKey: ['repos', id],
    queryFn: () => repoService.get(id),
    enabled: !!id,
  })
}
