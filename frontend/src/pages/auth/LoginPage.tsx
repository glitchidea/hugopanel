import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { LoginRequest } from '@/types/auth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true)
    try {
      await login(data)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(error?.response?.data?.error?.message || 'Invalid credentials')
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
      {/* Background gradient blobs */}
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          left: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(220,75%,52%,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-20%',
          right: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(260,75%,62%,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="glass-card animate-fade-in"
        style={{ width: '100%', maxWidth: 400, padding: 32 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px',
              letterSpacing: '-0.5px',
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Sign in to your HugoPanel account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label className="label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && (
              <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="label" htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                style={{ paddingRight: 40 }}
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 2,
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ justifyContent: 'center', marginTop: 4, height: 40 }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--text-muted)',
          }}
        >
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
