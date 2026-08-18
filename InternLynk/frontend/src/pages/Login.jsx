import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { id: 'student',        label: 'Student' },
  { id: 'software_house', label: 'Software House' },
  { id: 'university',     label: 'University' },
  { id: 'admin',          label: 'Admin' },
]

export default function Login() {
  const { signIn, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [selectedRole, setSelectedRole] = useState('student')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [error, setError]               = useState('')
  const [info, setInfo]                 = useState('')
  const [loading, setLoading]           = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Show info message after email verification redirect
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setInfo('Email verified! You can now log in.')
    }
  }, [searchParams])

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      const map = {
        student:        '/dashboard/student',
        guest:          '/dashboard/guest',
        university:     '/dashboard/university',
        software_house: '/dashboard/software-house',
        admin:          '/dashboard/admin',
      }
      navigate(map[profile.role] || '/dashboard', { replace: true })
    }
  }, [user, profile, authLoading, navigate])

  const isStudent = selectedRole === 'student'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!password.trim()) {
      setError(isStudent ? 'Please enter your Student ID.' : 'Please enter your password.')
      return
    }

    setLoading(true)
    try {
      const { data, error: signInError } = await signIn(email.trim(), password.trim(), selectedRole)
      if (signInError) {
        setError(signInError.message || 'Login failed. Please check your credentials.')
      } else if (data?.profile || data?.user) {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('[Login] unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-[-5rem] left-[-5rem] w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-5rem] right-[-5rem] w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm mb-4">
            <span className="text-2xl font-black text-white tracking-tight">IL</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">InternLynk</h1>
          <p className="text-blue-200 text-sm mt-1">Academic Industry Internship & Talent Linkage Platform</p>
        </div>

        {/* Glass card */}
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Sign in to your account</h2>

          {/* Role Tabs */}
          <div className="grid grid-cols-4 gap-1 bg-white/5 rounded-xl p-1 mb-6">
            {ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => { setSelectedRole(role.id); setError('') }}
                className={`py-1.5 px-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                  selectedRole === role.id
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {/* Info banner */}
          {info && (
            <div className="mb-4 flex items-start gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-emerald-200 text-sm">{info}</p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2 bg-rose-500/20 border border-rose-400/30 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 text-rose-300 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-rose-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition text-sm"
              />
            </div>

            {/* Password / Student ID field */}
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">
                {isStudent ? 'Student ID / Password' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isStudent ? 'Enter your Student ID or password' : 'Enter your password'}
                  autoComplete="current-password"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 pr-11 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-blue-300 hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {isStudent && (
                <p className="mt-1.5 text-xs text-blue-300/80">
                  Students can log in with their Student ID or with a custom password if they have changed it.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in&hellip;
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center space-y-2">
            {selectedRole === 'software_house' && (
              <p className="text-sm text-blue-200">
                No account?{' '}
                <Link to="/signup" className="text-white font-medium hover:underline">
                  Register your company
                </Link>
              </p>
            )}
            {selectedRole === 'student' && (
              <p className="text-sm text-blue-200">
                New guest user?{' '}
                <Link to="/signup" className="text-white font-medium hover:underline">
                  Create an account
                </Link>
              </p>
            )}
            <p className="text-xs text-blue-300/70">
              University and Admin accounts are created by an administrator.
            </p>
          </div>
        </div>

        {/* Back to landing */}
        <p className="text-center mt-6 text-sm text-blue-300">
          <Link to="/" className="hover:text-white transition flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
