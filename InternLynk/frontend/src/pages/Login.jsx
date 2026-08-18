import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

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

  // 2FA OTP State
  const [showOtp, setShowOtp]           = useState(false)
  const [otpCode, setOtpCode]           = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading]     = useState(false)
  const [otpError, setOtpError]         = useState('')
  const [pendingUserRole, setPendingUserRole] = useState('')
  const [resendTimer, setResendTimer]   = useState(0)

  // Show info message after email verification redirect
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setInfo('Email verified! You can now log in.')
    }
  }, [searchParams])

  // Redirect if already logged in (Only redirect if not currently verifying OTP)
  useEffect(() => {
    if (!authLoading && user && profile && !showOtp) {
      const map = {
        student:        '/dashboard/student',
        guest:          '/dashboard/guest',
        university:     '/dashboard/university',
        software_house: '/dashboard/software-house',
        admin:          '/dashboard/admin',
      }
      navigate(map[profile.role] || '/dashboard', { replace: true })
    }
  }, [user, profile, authLoading, navigate, showOtp])

  // Resend Timer Effect
  useEffect(() => {
    let interval = null
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  const sendOtpCode = async (targetEmail, role = 'user') => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, role })
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('📱 Verification code sent to your Gmail!')
        setResendTimer(30)
        return true
      } else {
        setError(data.error || 'Failed to send OTP')
        return false
      }
    } catch (err) {
      setError('Failed to reach verification server')
      return false
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setOtpError('')
    const enteredOtp = otpCode.join('')
    if (enteredOtp.length < 6) {
      setOtpError('Please enter the complete 6-digit code.')
      return
    }

    setOtpLoading(true)
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: enteredOtp })
      })
      const resData = await response.json()
      if (response.ok) {
        toast.success('✅ 2FA verification successful! Redirecting...')
        
        // Determine correct dashboard from context profile or pending role
        const roleMap = {
          student: '/dashboard/student',
          guest: '/dashboard/guest',
          university: '/dashboard/university',
          software_house: '/dashboard/software-house',
          admin: '/dashboard/admin',
        }
        const targetRole = profile?.role || pendingUserRole
        const destination = roleMap[targetRole] || '/dashboard'
        
        // Clear OTP screen then navigate
        setShowOtp(false)
        navigate(destination, { replace: true })
      } else {
        setOtpError(resData.error || 'Invalid OTP verification code')
      }
    } catch (err) {
      setOtpError('Failed to reach verification server')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return
    const newOtp = [...otpCode]
    newOtp[index] = value.slice(-1)
    setOtpCode(newOtp)

    // Auto focus next field
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

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
      } else {
        const userRole = data?.profile?.role || selectedRole
        setPendingUserRole(userRole)
        
        // Trigger 2FA OTP delivery
        const otpSent = await sendOtpCode(email.trim(), userRole)
        if (otpSent) {
          setShowOtp(true)
        }
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
          {showOtp ? (
            /* OTP Verification Screen */
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-200 mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">Two-Step Verification</h2>
                <p className="text-blue-200 text-xs mt-1.5 leading-relaxed">
                  A 6-digit security code has been sent to your Gmail:
                </p>
                <p className="text-white font-semibold text-sm mt-1">
                  {email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + gp3.replace(/./g, '*'))}
                </p>
              </div>

              {/* Admin security warning */}
              {(pendingUserRole === 'admin' || selectedRole === 'admin') && (
                <div className="flex items-start gap-2 bg-amber-500/15 border border-amber-400/30 rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className="text-amber-200 text-xs font-semibold">Admin Security Check</p>
                    <p className="text-amber-300/80 text-xs mt-0.5">Check your private admin Gmail on your mobile. Do not share this code with anyone.</p>
                  </div>
                </div>
              )}

              {otpError && (
                <div className="flex items-start gap-2 bg-rose-500/20 border border-rose-400/30 rounded-lg px-4 py-3 text-rose-200 text-xs">
                  <svg className="w-4 h-4 text-rose-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <span>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* 6-digit inputs */}
                <div className="flex justify-between gap-2">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      required
                      className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl text-center text-xl font-extrabold text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition"
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {otpLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Access Portal'
                    )}
                  </button>

                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtp(false)
                        setOtpCode(['', '', '', '', '', ''])
                      }}
                      className="text-blue-300 hover:text-white transition font-medium cursor-pointer"
                    >
                      ← Back to Login
                    </button>

                    {resendTimer > 0 ? (
                      <span className="text-blue-300/80">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendOtpCode(email.trim())}
                        className="text-white hover:underline font-bold cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* Standard Login Form */
            <>
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
                  className="w-full mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 text-sm cursor-pointer"
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
            </>
          )}
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
