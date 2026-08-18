import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfilePictureUrl } from '../utils/api'
import ProfilePictureModal from './ProfilePictureModal'
import logo from '../logos/logo.jpeg'

export default function Sidebar() {
  const { user, profile, signOut } = useAuth()
  const { pathname } = useLocation()
  const [showModal, setShowModal] = useState(false)

  const isActive = (to) => pathname === to || pathname.startsWith(to + '/')

  const isAdmin = profile?.role === 'admin'

  const links = isAdmin
    ? [
        { to: '/dashboard/admin', label: 'Dashboard', icon: 'dashboard' },
        { to: '/admin/users', label: 'User Management', icon: 'users' },
        { to: '/admin/pending-accounts', label: 'Pending Accounts', icon: 'pending-users' },
        { to: '/admin/pending-internships', label: 'Pending Internships', icon: 'pending-internships' },
        { to: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
        { to: '/admin/logs', label: 'Audit Logs', icon: 'logs' },
        { to: '/admin/notifications', label: 'Notifications', icon: 'notifications' },
        { to: '/admin/settings', label: 'Settings', icon: 'settings' },
      ]
    : [
        { to: '/dashboard/university', label: 'Dashboard', icon: 'dashboard' },
        { to: '/university/students', label: 'Students', icon: 'students' },
        { to: '/bulk-upload', label: 'Bulk Upload', icon: 'upload' },
        { to: '/university/applications', label: 'Applications', icon: 'applications' },
        { to: '/university/analytics', label: 'Analytics', icon: 'analytics' },
        { to: '/university/settings', label: 'Settings', icon: 'settings' },
      ]

  const NavIcon = ({ name, active }) => {
    const color = active ? 'text-blue-600' : 'text-gray-400'
    switch (name) {
      case 'dashboard':
        return (
          <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="8" height="8" rx="2" strokeWidth="2" />
            <rect x="13" y="3" width="8" height="8" rx="2" strokeWidth="2" />
            <rect x="3" y="13" width="8" height="8" rx="2" strokeWidth="2" />
            <rect x="13" y="13" width="8" height="8" rx="2" strokeWidth="2" />
          </svg>
        )
      case 'users':
      case 'students':
        return (
          <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
          </svg>
        )
      case 'pending-users':
        return (
          <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )
      case 'pending-internships':
      case 'applications':
        return (
          <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      case 'upload':
        return (
          <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        )
      case 'analytics':
        return (
          <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="12" width="3" height="8" rx="1" strokeWidth="2" />
            <rect x="10.5" y="8" width="3" height="12" rx="1" strokeWidth="2" />
            <rect x="17" y="4" width="3" height="16" rx="1" strokeWidth="2" />
          </svg>
        )
      case 'logs':
        return (
          <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'notifications':
        return (
          <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
      case 'settings':
        return (
          <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 011.35-.436l1.932.966a1 1 0 00.894 0l1.932-.966a1 1 0 011.35.436l1.12 1.94a1 1 0 00.223.26l1.694 1.273a1 1 0 01.364 1.093l-.567 2.138a1 1 0 000 .516l.567 2.138a1 1 0 01-.364 1.093l-1.694 1.273a1 1 0 00-.223.26l-1.12 1.94a1 1 0 01-1.35.436l-1.932-.966a1 1 0 00-.894 0l-1.932.966a1 1 0 01-1.35-.436l-1.12-1.94a1 1 0 00-.223-.26l-1.694-1.273a1 1 0 01-.364-1.093l.567-2.138a1 1 0 000-.516l-.567-2.138a1 1 0 01.364-1.093l1.694-1.273a1 1 0 00.223-.26l1.12-1.94z" />
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
          </svg>
        )
      default:
        return null
    }
  }

  const renderLink = (link) => {
    const active = isActive(link.to)
    return (
      <Link
        key={link.to}
        to={link.to}
        className={`flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          active ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span className={active ? 'text-blue-600' : 'text-gray-500'}>
          <NavIcon name={link.icon} active={active} />
        </span>
        <span>{link.label}</span>
      </Link>
    )
  }

  const initials = (user?.email || 'U')[0]?.toUpperCase()
  const pictureUrl = profile?.profile_picture ? getProfilePictureUrl(profile.profile_picture) : null
  const userName = profile?.organization_name || profile?.full_name || null

  return (
    <>
      <aside className="w-64 bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 border-r border-indigo-100 shadow-sm h-full flex flex-col justify-between overflow-y-auto">
        {/* Brand */}
        <div className="px-5 pt-6 pb-4 border-b border-indigo-100">
          <div className="flex items-center gap-3">
            <img src={logo} alt="InternLynk logo" className="w-9 h-9 rounded-lg object-cover shadow-sm ring-1 ring-blue-200" />
            <div>
              <div className="text-base font-bold tracking-tight text-blue-600">InternLynk</div>
              <div className="text-xs text-gray-600">{isAdmin ? 'Admin Portal' : 'University Portal'}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {links.map(renderLink)}
          </nav>
        </div>

        {/* Bottom profile + actions */}
        <div className="border-t border-indigo-100 px-5 py-4 bg-white/40 backdrop-blur-sm">
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity p-2 rounded-lg hover:bg-white/60"
          >
            {pictureUrl ? (
              <div className="relative">
                <img
                  src={pictureUrl}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-blue-200 shadow-sm hidden">
                  <span className="text-sm font-semibold text-white">{initials}</span>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-blue-200 shadow-sm">
                <span className="text-sm font-semibold text-white">{initials}</span>
              </div>
            )}
            <div className="flex flex-col text-left flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">{userName || 'University'}</span>
              <span className="text-xs text-gray-600 truncate">
                {profile?.role ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1)) : 'University'}
              </span>
            </div>
          </button>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <ProfilePictureModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        profilePicture={profile?.profile_picture}
        userName={userName}
        userRole={profile?.role || ''}
      />
    </>
  )
}
