import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Zap, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { RegisterRequest } from '@/types/auth'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterRequest>()

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true)
    try {
      await registerUser(data)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(error?.response?.data?.error?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: 24,
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          right: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(260,75%,62%,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="glass-card animate-fade-in"
        style={{ width: '100%', maxWidth: 400, padding: 32 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, hsl(220,75%,52%), hsl(260,75%,62%))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 24px -6px hsl(220,75%,52%,0.6)',
            }}
          >
            <Zap size={24} color="white" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Create account
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Start managing your Hugo sites
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.email.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              type="text"
              className="input"
              placeholder="johndoe"
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Min 3 characters' },
                maxLength: { value: 64, message: 'Max 64 characters' },
                pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Only letters, numbers, - and _' },
              })}
            />
            {errors.username && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.username.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className="input"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
            />
            {errors.password && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.password.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="reg-password2">Confirm password</label>
            <input
              id="reg-password2"
              type="password"
              className="input"
              placeholder="••••••••"
              {...register('password2', {
                required: 'Please confirm your password',
                validate: (val) => val === watch('password') || 'Passwords do not match',
              })}
            />
            {errors.password2 && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.password2.message}</p>}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ justifyContent: 'center', marginTop: 4, height: 40 }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--text-muted)',
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
