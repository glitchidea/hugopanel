// Post types
export interface FrontMatter {
  title: string
  date: string
  draft: boolean
  description: string
  tags: string[]
  categories: string[]
  author: string
  slug: string
  image: string
  weight: number
  [key: string]: unknown
}

export interface PostSummary {
  path: string
  title: string
  date: string
  draft: boolean
  tags: string[]
  categories: string[]
  description: string
  section: string
  author: string
  slug: string
  last_modified: number
}

export interface PostDetail {
  path: string
  front_matter: FrontMatter
  content: string
  format: 'yaml' | 'toml' | 'json' | 'unknown'
  last_modified: number
}

export interface CreatePostRequest {
  file_path: string
  front_matter: Partial<FrontMatter>
  content: string
  commit_message: string
  branch?: string
}

export interface UpdatePostRequest {
  front_matter: Partial<FrontMatter>
  content: string
  commit_message: string
  branch?: string
}

export interface PostListMeta {
  count: number
  page: number
  page_size: number
  total_pages: number
}

export interface PostFilters {
  search?: string
  status?: 'draft' | 'published' | ''
  section?: string
  sort?: 'date' | 'title' | 'modified'
  page?: number
}
