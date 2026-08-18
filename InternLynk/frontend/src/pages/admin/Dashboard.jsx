import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'

function StatCard({ label, value, icon, color, to }) {
  const card = (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        const [
          { count: totalUsers },
          { count: pendingAccounts },
          { count: totalInternships },
          { count: pendingInternships },
          { data: recentProfiles },
          { data: recentInternshipsList },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
          supabase.from('internships').select('*', { count: 'exact', head: true }),
          supabase.from('internships').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('profiles').select('id, full_name, organization_name, email, role, created_at, approval_status').order('created_at', { ascending: false }).limit(5),
          supabase.from('internships').select('id, title, status, created_at, created_by, software_house_id').order('created_at', { ascending: false }).limit(5),
        ])

        setStats({ totalUsers, pendingAccounts, totalInternships, pendingInternships })

        // Fetch posters profiles
        const posterIds = [...new Set((recentInternshipsList || []).map(i => i.created_by || i.software_house_id).filter(Boolean))]
        let posterMap = {}
        if (posterIds.length > 0) {
          const { data: posters } = await supabase
            .from('profiles')
            .select('id, organization_name, full_name')
            .in('id', posterIds)
          posterMap = (posters || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
        }

        const activities = [
          ...(recentProfiles || []).map(p => ({
            id: `profile-${p.id}`,
            type: 'user',
            label: p.full_name || p.organization_name || p.email,
            sub: `Registered as ${p.role}`,
            status: p.approval_status,
            date: p.created_at,
          })),
          ...(recentInternshipsList || []).map(i => {
            const poster = posterMap[i.created_by || i.software_house_id]
            return {
              id: `internship-${i.id}`,
              type: 'internship',
              label: i.title,
              sub: `Posted by ${poster?.organization_name || poster?.full_name || 'Unknown'}`,
              status: i.status,
              date: i.created_at,
            }
          }),
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)

        setRecentActivity(activities)
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const statusBadge = (status) => {
    const map = {
      approved: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-amber-100 text-amber-700',
      rejected: 'bg-rose-100 text-rose-700',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    )
  }

  if (loading) return <Spinner />
  if (error) return <div className="p-6 text-rose-600 bg-rose-50 rounded-xl">{error}</div>

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-indigo-100">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {profile?.full_name || 'Admin'}. Here's what's happening on the platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers}
          color="bg-blue-100 text-blue-600"
          to="/admin/users"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Pending Accounts"
          value={stats?.pendingAccounts}
          color="bg-amber-100 text-amber-600"
          to="/admin/pending-accounts"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Internships"
          value={stats?.totalInternships}
          color="bg-indigo-100 text-indigo-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Pending Internships"
          value={stats?.pendingInternships}
          color="bg-rose-100 text-rose-600"
          to="/admin/pending-internships"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentActivity.map(item => (
                <li key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {item.type === 'user' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {statusBadge(item.status)}
                    <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { to: '/admin/pending-accounts', label: 'Review Pending Accounts', icon: '👤', badge: stats?.pendingAccounts, badgeColor: 'bg-amber-500' },
                { to: '/admin/pending-internships', label: 'Review Pending Internships', icon: '📋', badge: stats?.pendingInternships, badgeColor: 'bg-rose-500' },
                { to: '/admin/users', label: 'User Management', icon: '🔧' },
                { to: '/admin/analytics', label: 'View Analytics', icon: '📊' },
                { to: '/admin/logs', label: 'Audit Logs', icon: '🗒️' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors group"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                    <span>{link.icon}</span>
                    {link.label}
                  </span>
                  {link.badge > 0 && (
                    <span className={`${link.badgeColor} text-white text-xs px-2 py-0.5 rounded-full`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl p-5 text-white">
            <p className="text-sm font-semibold opacity-90">Platform Approval Rate</p>
            <p className="text-3xl font-bold mt-1">
              {stats && stats.totalUsers > 0
                ? Math.round(((stats.totalUsers - stats.pendingAccounts) / stats.totalUsers) * 100)
                : 0}%
            </p>
            <p className="text-xs opacity-75 mt-1">Of users have been processed</p>
          </div>
        </div>
      </div>
    </div>
  )
}
