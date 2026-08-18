import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import { getProfilePictureUrl, uploadProfilePicture } from '../../utils/api'
import toast from 'react-hot-toast'
import {
  Building2,
  Mail,
  User,
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
  Info,
  Camera,
  School,
  CheckCircle2
} from 'lucide-react'

export default function Settings() {
  const { user, profile, updateProfile } = useAuth()

  // Profile Form State
  const [organizationName, setOrganizationName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Profile Picture State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)

  // Password Form State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Sync state when profile or user changes
  useEffect(() => {
    if (profile) {
      setOrganizationName(profile.organization_name || '')
      setContactPerson(profile.full_name || '')
      setContactEmail(profile.email || user?.email || '')
    } else if (user) {
      setContactEmail(user.email || '')
    }
  }, [profile, user])

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault()

    if (!organizationName.trim()) {
      toast.error('University / Institution name is required')
      return
    }

    if (!contactEmail.trim()) {
      toast.error('Contact email is required')
      return
    }

    try {
      setIsUpdatingProfile(true)

      // 1. Update profiles table using useAuth updateProfile
      const { error: profileError } = await updateProfile({
        organization_name: organizationName.trim(),
        full_name: contactPerson.trim() || null,
        email: contactEmail.trim().toLowerCase(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        throw new Error(profileError.message || 'Failed to update university profile.')
      }

      // 2. If email changed, also update Supabase Auth user email
      if (contactEmail.trim().toLowerCase() !== user?.email?.toLowerCase()) {
        const { error: authError } = await supabase.auth.updateUser({
          email: contactEmail.trim().toLowerCase(),
        })
        if (authError) {
          toast.error(`Profile saved, but auth email update pending: ${authError.message}`)
        } else {
          toast.success('Confirmation email sent to verify new email address.')
        }
      }

      toast.success('University profile updated successfully!')
    } catch (err) {
      console.error('[Settings] Error updating profile:', err)
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle Profile Picture Change
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    // Validate image type
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      toast.error('Only image files (JPEG, PNG, WebP) are allowed')
      return
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    try {
      setIsUploadingPhoto(true)
      const res = await uploadProfilePicture(file, user.id)

      if (!res.success) {
        throw new Error(res.error || 'Upload failed')
      }

      // Update auth profile state with new picture path
      await updateProfile({
        profile_picture: res.filePath,
      })

      toast.success('Logo updated successfully!')
    } catch (err) {
      console.error('[Settings] Photo upload error:', err)
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setIsUploadingPhoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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

      toast.success('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('[Settings] Error changing password:', err)
      toast.error(err.message || 'Failed to update password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const pictureUrl = profile?.profile_picture ? getProfilePictureUrl(profile.profile_picture) : null
  const initials = (organizationName || contactPerson || user?.email || 'U')[0]?.toUpperCase()

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              <School className="w-3.5 h-3.5 mr-1" />
              University Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">University Settings & Preferences</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage your institution details, contact information, and security credentials.
          </p>
        </div>

        {/* Institution Badge Preview */}
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-indigo-100 shadow-sm">
          <div className="relative">
            {pictureUrl ? (
              <img
                src={pictureUrl}
                alt="University Logo"
                className="w-11 h-11 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {initials}
              </div>
            )}
          </div>
          <div className="text-left">
            <p className="font-semibold text-xs leading-tight text-gray-900 truncate max-w-[180px]">
              {organizationName || 'University Partner'}
            </p>
            <p className="text-[11px] text-gray-500 truncate max-w-[180px]">{contactEmail || user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Edit Information & Security */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile & Institution Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Institution Profile</h2>
                <p className="text-xs text-gray-500">Update university branding and contact details</p>
              </div>
            </div>

            {/* University Logo Upload Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group">
                {pictureUrl ? (
                  <img
                    src={pictureUrl}
                    alt="University Logo"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xl shadow-md">
                    {initials}
                  </div>
                )}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-gray-900">University Logo / Seal</h4>
                <p className="text-xs text-gray-500 mt-0.5">Appears on student invitations and reports (JPEG, PNG, max 5MB)</p>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {isUploadingPhoto ? 'Uploading...' : 'Change Logo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  University / Institution Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <School className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. National University of Sciences and Technology"
                    className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Coordinator / Focal Person Name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Dr. Robert Miller (Placement Director)"
                    className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Official Contact Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="placements@university.edu"
                    className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Used for internship placement updates, student registration notices, and system alerts.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end">
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
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Security & Authentication</h2>
                <p className="text-xs text-gray-500">Update your university portal password</p>
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
                  <p
                    className={`mt-1.5 text-xs flex items-center gap-1 ${
                      newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
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

        {/* Right 1 Column: Institution Information & Details */}
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
                  University
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
                <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Partner Since</span>
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
                <span className="text-gray-400 text-xs block mb-1">University UID</span>
                <span className="font-mono text-[11px] text-gray-600 bg-gray-50 p-2 rounded block break-all border border-gray-100">
                  {user?.id || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-5 border border-indigo-100 text-gray-700">
            <h4 className="font-bold text-sm text-indigo-900 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              University Privileges
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-600 leading-relaxed list-disc list-inside">
              <li>Direct bulk CSV student batch registration</li>
              <li>Real-time application & placement tracking</li>
              <li>Institutional performance and hiring reports</li>
              <li>Verified partner badge for students</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
