// Auth types
export interface User {
  id: string
  email: string
  username: string
  default_commit_template: string
  default_branch: string
  default_content_path: string
  git_author_name: string
  git_author_email: string
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  password2: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface TokenRefreshResponse {
  access: string
}
