import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfilePictureUrl } from '../utils/api'
import ProfilePictureModal from './ProfilePictureModal'

// Generic Header for non-admin authenticated users (e.g. university role).
export default function Header() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const pictureUrl = profile?.profile_picture ? getProfilePictureUrl(profile.profile_picture) : null
  const userName = profile?.organization_name || profile?.full_name || 'User'
  const role = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ')
    : ''

  return (
    <>
      <header className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 border-b border-indigo-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-end gap-4">
          {/* Role badge */}
          {role && (
            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              {role}
            </span>
          )}

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-900 leading-tight">{userName}</div>
              <div className="text-xs text-gray-500">{profile?.email || ''}</div>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="cursor-pointer hover:opacity-85 transition focus:outline-none"
              title="Click to view or change profile photo"
            >
              {pictureUrl ? (
                <img
                  src={pictureUrl}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-blue-200 shadow-sm">
                  <span className="text-sm font-semibold text-white">
                    {userName?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      <ProfilePictureModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        profilePicture={profile?.profile_picture}
        userName={userName}
        userEmail={profile?.email}
        userRole={profile?.role}
      />
    </>
  )
}
