import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import {
  ArrowLeft, Save, Loader2, Bold, Italic, Link as LinkIcon,
  Code, Quote, Heading2, Heading3, List, Eye, EyeOff, GitCommit
} from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { usePost, useCreatePost, useUpdatePost } from '@/hooks/usePosts'
import { useRepoStore } from '@/stores/repoStore'
import { useAuthStore } from '@/stores/authStore'
import { formatCommitMessage } from '@/utils/commitMessage'
import type { FrontMatter } from '@/types/post'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface EditorFormData {
  front_matter: Partial<FrontMatter>
  content: string
  commit_message: string
  branch: string
  file_path: string
}

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag))

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        minHeight: 36,
        alignItems: 'center',
        cursor: 'text',
      }}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="badge badge-blue"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => remove(tag)}
        >
          {tag} ✕
        </span>
      ))}
      <input
        style={{
          flex: 1,
          minWidth: 60,
          background: 'none',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontSize: 13,
        }}
        value={input}
        placeholder={value.length === 0 ? 'Add tags...' : ''}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add()
          }
          if (e.key === 'Backspace' && !input && value.length > 0) {
            remove(value[value.length - 1])
          }
        }}
        onBlur={add}
      />
    </div>
  )
}

function ToolbarButton({ icon: Icon, title, onClick }: { icon: React.ElementType; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="btn-ghost"
      style={{ padding: '5px 7px', borderRadius: 6 }}
    >
      <Icon size={14} />
    </button>
  )
}

export default function PostEditorPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const repoId = searchParams.get('repo') || ''
  const filePath = searchParams.get('path') || ''
  const isNew = !filePath

  const { selectedRepo, repositories } = useRepoStore()
  const { user } = useAuthStore()

  const activeRepo = selectedRepo || repositories.find((r) => r.id === repoId) || null

  const { data: postDetail, isLoading: isLoadingPost } = usePost(repoId, filePath || undefined)
  const createPost = useCreatePost(repoId)
  const updatePost = useUpdatePost(repoId, filePath)

  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const commitTemplate = user?.default_commit_template || 'feat: {action} {file}'
  const defaultBranch = activeRepo?.default_branch || user?.default_branch || 'main'

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<EditorFormData>({
    defaultValues: {
      front_matter: {
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        draft: false,
        description: '',
        tags: [],
        categories: [],
        author: user?.username || '',
        slug: '',
      },
      commit_message: formatCommitMessage(commitTemplate, isNew ? 'add' : 'update', 'post'),
      branch: defaultBranch,
      file_path: '',
    },
  })

  useEffect(() => {
    if (postDetail) {
      setContent(postDetail.content)
      reset({
        front_matter: postDetail.front_matter,
        content: postDetail.content,
        commit_message: formatCommitMessage(
          commitTemplate,
          'update',
          postDetail.front_matter.title || filePath,
        ),
        branch: defaultBranch,
        file_path: filePath,
      })
    }
  }, [postDetail])

  const insertText = useCallback((before: string, after = '') => {
    setContent((prev) => `${prev}${before}selection${after}`)
  }, [])

  const onSubmit = async (data: EditorFormData) => {
    setIsSaving(true)
    try {
      if (isNew) {
        if (!data.file_path) {
          toast.error('File path is required')
          setIsSaving(false)
          return
        }
        await createPost.mutateAsync({
          file_path: data.file_path,
          front_matter: data.front_matter,
          content,
          commit_message: data.commit_message,
          branch: data.branch || undefined,
        })
        navigate(`/posts?repo=${repoId}`)
      } else {
        await updatePost.mutateAsync({
          front_matter: data.front_matter,
          content,
          commit_message: data.commit_message,
          branch: data.branch || undefined,
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingPost && !isNew) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading post...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 56px - 48px)', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <Link
          to={`/posts?repo=${repoId}`}
          className="btn-ghost"
          style={{ textDecoration: 'none', padding: '6px 10px' }}
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {isNew ? 'New Post' : (postDetail?.front_matter.title || 'Edit Post')}
          </h2>
          {activeRepo && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeRepo.display_name}</div>
          )}
        </div>
        <button
          form="editor-form"
          type="submit"
          className="btn-primary"
          disabled={isSaving}
          style={{ gap: 6 }}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isSaving ? 'Saving...' : 'Save & Push'}
        </button>
      </div>

      <form
        id="editor-form"
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}
      >
        {/* Left panel — Front Matter */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              height: '100%',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
              Front Matter
            </div>

            {/* File path (new only) */}
            {isNew && (
              <div>
                <label className="label" htmlFor="fm-file-path">File Path *</label>
                <input
                  id="fm-file-path"
                  className="input"
                  style={{ fontSize: 12, fontFamily: 'monospace' }}
                  placeholder="content/blog/my-post.md"
                  {...register('file_path', { required: isNew })}
                />
              </div>
            )}

            {/* Title */}
            <div>
              <label className="label" htmlFor="fm-title">Title *</label>
              <input
                id="fm-title"
                className="input"
                placeholder="My Post Title"
                {...register('front_matter.title', { required: 'Title required' })}
              />
            </div>

            {/* Date */}
            <div>
              <label className="label" htmlFor="fm-date">Date</label>
              <input
                id="fm-date"
                type="date"
                className="input"
                {...register('front_matter.date')}
              />
            </div>

            {/* Draft toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="label" style={{ marginBottom: 0 }}>Draft</label>
              <Controller
                name="front_matter.draft"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      background: field.value ? 'hsl(38,92%,50%)' : 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: 2,
                        left: field.value ? 20 : 2,
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                    />
                  </button>
                )}
              />
            </div>

            {/* Description */}
            <div>
              <label className="label" htmlFor="fm-desc">Description</label>
              <textarea
                id="fm-desc"
                className="input"
                rows={2}
                style={{ resize: 'vertical', fontSize: 12 }}
                placeholder="Short description..."
                {...register('front_matter.description')}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="label">Tags</label>
              <Controller
                name="front_matter.tags"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={(field.value as string[]) || []}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Categories */}
            <div>
              <label className="label">Categories</label>
              <Controller
                name="front_matter.categories"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={(field.value as string[]) || []}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="label" htmlFor="fm-slug">Slug</label>
              <input
                id="fm-slug"
                className="input"
                style={{ fontSize: 12 }}
                placeholder="my-post-slug"
                {...register('front_matter.slug')}
              />
            </div>

            {/* Author */}
            <div>
              <label className="label" htmlFor="fm-author">Author</label>
              <input
                id="fm-author"
                className="input"
                style={{ fontSize: 12 }}
                {...register('front_matter.author')}
              />
            </div>

            {/* Divider */}
            <div className="divider" />

            {/* Commit info */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Commit
            </div>

            <div>
              <label className="label" htmlFor="fm-branch">Branch</label>
              <input
                id="fm-branch"
                className="input"
                style={{ fontSize: 12 }}
                {...register('branch')}
              />
            </div>

            <div>
              <label className="label" htmlFor="fm-commit-msg">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <GitCommit size={10} />
                  Commit Message
                </span>
              </label>
              <input
                id="fm-commit-msg"
                className="input"
                style={{ fontSize: 12 }}
                {...register('commit_message', { required: true, minLength: 3, maxLength: 256 })}
              />
            </div>
          </div>
        </div>

        {/* Right panel — Markdown Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: '6px 10px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px 10px 0 0',
              flexShrink: 0,
            }}
          >
            <ToolbarButton icon={Bold} title="Bold" onClick={() => insertText('**', '**')} />
            <ToolbarButton icon={Italic} title="Italic" onClick={() => insertText('_', '_')} />
            <ToolbarButton icon={LinkIcon} title="Link" onClick={() => insertText('[', '](url)')} />
            <ToolbarButton icon={Code} title="Code" onClick={() => insertText('`', '`')} />
            <ToolbarButton icon={Quote} title="Quote" onClick={() => setContent((p) => p + '\n> ')} />
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
            <ToolbarButton icon={Heading2} title="H2" onClick={() => setContent((p) => p + '\n## ')} />
            <ToolbarButton icon={Heading3} title="H3" onClick={() => setContent((p) => p + '\n### ')} />
            <ToolbarButton icon={List} title="List" onClick={() => setContent((p) => p + '\n- ')} />
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {content.length} chars · {content.split(/\s+/).filter(Boolean).length} words
            </div>
          </div>

          {/* Editor */}
          <div
            style={{
              flex: 1,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
              overflow: 'hidden',
            }}
          >
            <CodeMirror
              value={content}
              onChange={setContent}
              height="100%"
              extensions={[markdown(), EditorView.lineWrapping]}
              theme={oneDark}
              style={{ height: '100%' }}
              placeholder="Start writing your post in Markdown..."
            />
          </div>
        </div>
      </form>
    </div>
  )
}
