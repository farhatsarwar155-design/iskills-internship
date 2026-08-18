import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle,
  Briefcase
} from 'lucide-react'

const ROLES = [
  { 
    id: 'software_house', 
    label: 'Software House', 
    desc: 'Hire talent & post tech internships',
    icon: Building2 
  },
  { 
    id: 'guest', 
    label: 'Guest Applicant', 
    desc: 'Apply directly to open internships',
    icon: User 
  },
]

export default function Signup() {
  const { signUp, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [selectedRole, setSelectedRole] = useState('software_house')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [contactPerson, setContactPerson] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      const map = {
        student: '/dashboard/student',
        guest: '/dashboard/guest',
        university: '/dashboard/university',
        software_house: '/dashboard/software-house',
        admin: '/dashboard/admin',
      }
      navigate(map[profile.role] || '/dashboard', { replace: true })
    }
  }, [user, profile, authLoading, navigate])

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter a valid email address.')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email format (e.g. name@domain.com).')
      return false
    }

    if (selectedRole === 'software_house') {
      if (!organizationName.trim()) {
        setError('Please enter your Company / Organization name.')
        return false
      }
    } else {
      if (!fullName.trim()) {
        setError('Please enter your Full Name.')
        return false
      }
    }

    if (!password) {
      setError('Please enter a password.')
      return false
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setLoading(true)
    try {
      const profileData = {
        full_name: selectedRole === 'software_house' 
          ? (contactPerson.trim() || organizationName.trim()) 
          : fullName.trim(),
        organization_name: selectedRole === 'software_house' 
          ? organizationName.trim() 
          : null,
      }

      const { data, error: signUpError } = await signUp(
        email.trim(),
        password,
        selectedRole,
        profileData
      )

      if (signUpError) {
        setError(signUpError.message || 'Registration failed. Please try again.')
      } else {
        setRegisteredEmail(email.trim())
        setSuccess(true)
      }
    } catch (err) {
      console.error('[Signup] unexpected error:', err)
      setError(err.message || 'An unexpected error occurred. Please try again.')
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
      {/* Decorative blurred background orbs */}
      <div className="absolute top-[-6rem] left-[-6rem] w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-6rem] right-[-6rem] w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-lg relative z-10 py-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-inner group-hover:bg-white/20 transition-all">
              <span className="text-xl font-black text-white tracking-tight">IL</span>
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">InternLynk</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Create your account
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Join the Academic Industry Internship Linkage Platform
          </p>
        </div>

        {/* Glass Card Container */}
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {success ? (
            /* Success Verification State */
            <div className="text-center py-4 space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400/40 rounded-full flex items-center justify-center mx-auto text-emerald-300">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">Verification Email Sent!</h2>
                <p className="text-blue-100 text-sm mt-2 leading-relaxed">
                  We've sent a verification link to{' '}
                  <span className="font-semibold text-white underline decoration-blue-400">{registeredEmail}</span>.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left text-xs text-blue-200 space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-blue-300 font-bold">1.</span>
                  Open your email inbox (and check the spam folder if needed).
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-300 font-bold">2.</span>
                  Click the confirmation link to activate your email.
                </p>
                {selectedRole === 'software_house' && (
                  <p className="flex items-start gap-2 text-amber-200">
                    <span className="text-amber-300 font-bold">3.</span>
                    Software House accounts require administrator approval before logging in.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-semibold py-2.5 rounded-lg shadow-lg transition-all text-sm"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* Signup Form State */
            <div>
              {/* Role Selection Tabs */}
              <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">
                Select Account Type
              </label>
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {ROLES.map((r) => {
                  const Icon = r.icon
                  const isSelected = selectedRole === r.id
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r.id)
                        setError('')
                      }}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white/20 border-white text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-300' : 'text-blue-300/70'}`} />
                        <span className="text-sm font-bold">{r.label}</span>
                      </div>
                      <p className="text-[11px] opacity-80 leading-tight">{r.desc}</p>
                    </button>
                  )
                })}
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-5 flex items-start gap-2 bg-rose-500/20 border border-rose-400/30 rounded-lg px-4 py-3 text-rose-200 text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-300 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role-Specific Name Fields */}
                {selectedRole === 'software_house' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-blue-100 mb-1.5">
                        Company / Organization Name <span className="text-rose-300">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          placeholder="e.g. TechCorp Solutions"
                          required
                          className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-100 mb-1.5">
                        Contact Person Name <span className="text-blue-300/70 text-xs">(optional)</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          placeholder="e.g. John Doe (HR Lead)"
                          className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition text-sm"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1.5">
                      Full Name <span className="text-rose-300">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Jane Smith"
                        required
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">
                    {selectedRole === 'software_house' ? 'Company Work Email' : 'Email Address'}{' '}
                    <span className="text-rose-300">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'software_house' ? 'recruitment@company.com' : 'you@example.com'}
                      autoComplete="email"
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition text-sm"
                    />
                  </div>
                </div>

                {/* Password Fields in 2 columns on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1.5">
                      Password <span className="text-rose-300">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 chars"
                        autoComplete="new-password"
                        required
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-blue-300 hover:text-white transition"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1.5">
                      Confirm Password <span className="text-rose-300">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        required
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-blue-300 hover:text-white transition"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account&hellip;
                    </>
                  ) : (
                    <>
                      <span>Register as {selectedRole === 'software_house' ? 'Software House' : 'Guest'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 text-center space-y-2 pt-4 border-t border-white/10">
                <p className="text-sm text-blue-200">
                  Already have an account?{' '}
                  <Link to="/login" className="text-white font-medium hover:underline">
                    Sign in here
                  </Link>
                </p>
                <p className="text-xs text-blue-300/70">
                  Are you a university representative or affiliated student? Please contact your institution administrator for access credentials.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Back to landing */}
        <p className="text-center mt-6 text-sm text-blue-300">
          <Link to="/" className="hover:text-white transition inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
