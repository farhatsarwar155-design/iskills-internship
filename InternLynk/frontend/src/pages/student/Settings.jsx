import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import { getProfilePictureUrl } from '../../utils/api'
import toast from 'react-hot-toast'
import {
  User,
  Mail,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react'

export default function StudentSettings() {
  const { user, profile, updateProfile } = useAuth()

  // Profile Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password Form State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Sync state when profile or user changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setEmail(profile.email || user?.email || '')
    } else if (user) {
      setEmail(user.email || '')
    }
  }, [profile, user])

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    try {
      setIsUpdatingProfile(true)

      // 1. Update profiles table
      const { error: profileError } = await updateProfile({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        throw new Error(profileError.message || 'Failed to update profile.')
      }

      // 2. If email changed, also request Supabase Auth email update
      if (email.trim().toLowerCase() !== user?.email?.toLowerCase()) {
        const { error: authError } = await supabase.auth.updateUser({
          email: email.trim().toLowerCase(),
        })
        if (authError) {
          toast.error(`Profile saved, but auth email update pending: ${authError.message}`)
        } else {
          toast.success('Confirmation email sent to verify new email address.')
        }
      }

      toast.success('Profile updated successfully!')
    } catch (err) {
      console.error('[Settings] Error updating profile:', err)
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!newPassword) {
      toast.error('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setIsUpdatingPassword(true)

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      toast.success('Password changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('[Settings] Error changing password:', err)
      toast.error(err.message || 'Failed to change password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const role = profile?.role || 'student'
  const isGuest = role === 'guest'
  const pictureUrl = profile?.profile_picture ? getProfilePictureUrl(profile.profile_picture) : null
  const initials = (fullName || user?.email || (isGuest ? 'G' : 'S'))[0]?.toUpperCase()

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Account Settings
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-100 uppercase tracking-wide">
                {role}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile & Preferences</h1>
            <p className="mt-1 text-blue-100 text-sm max-w-xl">
              Manage your personal information, contact email, and security settings.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/15">
            {pictureUrl ? (
              <img
                src={pictureUrl}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-white/60 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center text-lg shadow-sm">
                {initials}
              </div>
            )}
            <div className="text-left">
              <p className="font-semibold text-sm leading-tight text-white">{fullName || 'Account User'}</p>
              <p className="text-xs text-blue-200 truncate max-w-[180px]">{email || user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Edit Profile & Password Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                <p className="text-xs text-gray-500">Update your primary identity and communication email</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  This email is used for application notifications and system alerts.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUpdatingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Password Change Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Security & Password</h2>
                <p className="text-xs text-gray-500">Update your account password to keep your portal secure</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && confirmPassword && (
                  <p className={`mt-1.5 text-xs flex items-center gap-1 ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {newPassword === confirmPassword ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Passwords match
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUpdatingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: Account Details & Status Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900 text-sm">Account Overview</h3>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Role</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                  {role}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Approval</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 capitalize">
                  {profile?.approval_status || 'Approved'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Member Since</span>
                <span className="text-gray-800 font-medium text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent'}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-400 text-xs block mb-1">User Identifier</span>
                <span className="font-mono text-[11px] text-gray-600 bg-gray-50 p-2 rounded block break-all border border-gray-100">
                  {user?.id || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-5 border border-indigo-100 text-gray-700">
            <h4 className="font-bold text-sm text-indigo-900 mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              Need Support?
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              If you require changes to your university affiliation, student roll number, or portal privileges, please reach out to your university coordinator or the platform administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
