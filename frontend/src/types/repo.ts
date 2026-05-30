// Repository types
export type Provider = 'github' | 'gitlab' | 'gitea'

export interface Repository {
  id: string
  name: string
  display_name: string
  provider: Provider
  clone_url: string
  default_branch: string
  content_path: string
  local_path: string
  last_synced: string | null
  is_syncing: boolean
  is_cloned: boolean
  post_count?: number
  created_at: string
  updated_at: string
}

export interface CreateRepositoryRequest {
  name: string
  display_name: string
  provider: Provider
  clone_url: string
  access_token: string
  default_branch: string
  content_path: string
}

export interface FileTreeItem {
  path: string
  name: string
  size: number
  modified: number
}

export interface AuditLog {
  id: string
  action: 'create' | 'update' | 'delete' | 'sync' | 'clone'
  file_path: string
  commit_sha: string | null
  commit_msg: string
  user_username: string
  created_at: string
}
