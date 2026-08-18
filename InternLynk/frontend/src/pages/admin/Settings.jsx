import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import { getProfilePictureUrl } from '../../utils/api'
import { logAdminAction } from '../../utils/logging'
import toast from 'react-hot-toast'
import {
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  KeyRound,
  Database,
  Sliders
} from 'lucide-react'

export default function Settings() {
  const { user, profile, updateProfile } = useAuth()

  // Profile Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password Form State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // System Diagnostics State
  const [checkingSystem, setCheckingSystem] = useState(false)
  const [systemStatus, setSystemStatus] = useState({
    dbConnected: true,
    profilesCount: 0,
    internshipsCount: 0,
    applicationsCount: 0,
    lastChecked: null,
  })

  // Sync profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setEmail(profile.email || user?.email || '')
      setOrganizationName(profile.organization_name || '')
    } else if (user) {
      setEmail(user.email || '')
    }
  }, [profile, user])

  // Check system health
  const checkSystemHealth = async () => {
    try {
      setCheckingSystem(true)
      const [
        { count: profilesCount, error: pErr },
        { count: internshipsCount, error: iErr },
        { count: applicationsCount, error: aErr },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('internships').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
      ])

      const hasError = !!(pErr || iErr || aErr)
      setSystemStatus({
        dbConnected: !hasError,
        profilesCount: profilesCount || 0,
        internshipsCount: internshipsCount || 0,
        applicationsCount: applicationsCount || 0,
        lastChecked: new Date().toLocaleTimeString(),
      })

      if (!hasError) {
        toast.success('All system services are operational!')
      }
    } catch (err) {
      setSystemStatus((prev) => ({ ...prev, dbConnected: false, lastChecked: new Date().toLocaleTimeString() }))
      toast.error('System health check encountered issues')
    } finally {
      setCheckingSystem(false)
    }
  }

  useEffect(() => {
    checkSystemHealth()
  }, [])

  // Handle Profile Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Full Name is required')
      return
    }

    try {
      setIsUpdatingProfile(true)

      // 1. Update profiles table
      const { error: profileError } = await updateProfile({
        full_name: fullName.trim(),
        organization_name: organizationName.trim(),
        email: email.trim().toLowerCase(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) throw profileError

      // 2. If email changed, update auth
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

      await logAdminAction(
        'update_admin_profile',
        'profile',
        user.id,
        `Admin updated profile settings (${fullName})`,
        { fullName, organizationName, email }
      )

      toast.success('Admin profile updated successfully!')
    } catch (err) {
      console.error('Error updating admin profile:', err)
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle Password Submit
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

      if (error) throw error

      await logAdminAction(
        'change_password',
        'system',
        user.id,
        'Admin changed account password'
      )

      toast.success('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('Error changing password:', err)
      toast.error(err.message || 'Failed to change password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const pictureUrl = profile?.profile_picture ? getProfilePictureUrl(profile.profile_picture) : null
  const initials = (fullName || user?.email || 'A')[0]?.toUpperCase()

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-indigo-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Admin Settings & Configuration</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your administrator credentials, security preferences, and view platform system status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Admin Profile Information</h3>
                <p className="text-xs text-gray-500">Update your account name and administrative email</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Platform Administrator"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Organization / Department
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. AIILP Executive Operations"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aiilp.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                <p className="text-xs text-gray-500">Ensure your administrator account uses a strong password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: System Status Summary */}
        <div className="space-y-6">
          {/* Admin Avatar Preview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-md">
              {pictureUrl ? (
                <img src={pictureUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <h3 className="font-bold text-gray-900">{fullName || 'Administrator'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{email}</p>
            <div className="mt-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                System Administrator
              </span>
            </div>
          </div>

          {/* System Status Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">System Health</h3>
              </div>
              <button
                onClick={checkSystemHealth}
                disabled={checkingSystem}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingSystem ? 'animate-spin' : ''}`} />
                Check
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-gray-400" />
                  Database Link:
                </span>
                {systemStatus.dbConnected ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Offline
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total User Profiles:</span>
                <span className="font-bold text-gray-800">{systemStatus.profilesCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total Internships:</span>
                <span className="font-bold text-gray-800">{systemStatus.internshipsCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total Applications:</span>
                <span className="font-bold text-gray-800">{systemStatus.applicationsCount}</span>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <span>Last verified:</span>
                <span>{systemStatus.lastChecked || 'Just now'}</span>
              </div>
            </div>
          </div>

          {/* Platform Settings Summary */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-200" />
              <h4 className="font-bold text-sm">Platform Policies</h4>
            </div>
            <div className="text-xs space-y-2 text-indigo-100">
              <div className="flex justify-between py-1 border-b border-indigo-500/40">
                <span>Software House Approval:</span>
                <span className="font-semibold text-white">Manual Admin</span>
              </div>
              <div className="flex justify-between py-1 border-b border-indigo-500/40">
                <span>Listing Review:</span>
                <span className="font-semibold text-white">Required</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Audit Logging:</span>
                <span className="font-semibold text-white">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
