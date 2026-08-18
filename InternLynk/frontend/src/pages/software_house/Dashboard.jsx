import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, applicants: 0 })
  const [recentApplications, setRecentApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id) fetchDashboardData()
  }, [user?.id])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      // Fetch internships created by this user
      const { data: internships, error: intErr } = await supabase
        .from('internships')
        .select('id, status')
        .eq('created_by', user.id)

      if (intErr) throw intErr

      const internshipIds = internships.map(i => i.id)
      const total = internships.length
      const pending = internships.filter(i => i.status === 'pending').length
      const active = internships.filter(i => i.status === 'approved').length

      let applicants = 0
      let recentApps = []

      if (internshipIds.length > 0) {
        // Count total applicants
        const { count, error: countErr } = await supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .in('internship_id', internshipIds)

        if (countErr) throw countErr
        applicants = count || 0

        // Fetch recent applications with internship title
        const { data: apps, error: appsErr } = await supabase
          .from('applications')
          .select('*, internships(title)')
          .in('internship_id', internshipIds)
          .limit(8)

        if (appsErr) throw appsErr

        let appsList = apps || []
        const userIds = [...new Set(appsList.map(a => a.user_id).filter(Boolean))]
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds)
          const profileMap = (profilesData || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
          appsList = appsList.map(a => ({ ...a, profiles: profileMap[a.user_id] }))
        }
        recentApps = appsList
      }

      setStats({ total, pending, active, applicants })
      setRecentApplications(recentApps)
    } catch (err) {
      console.error('Dashboard error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const statusBadge = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-rose-100 text-rose-700',
    }
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`
  }

  const statCards = [
    {
      label: 'Total Internships',
      value: stats.total,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Pending Approval',
      value: stats.pending,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Active Internships',
      value: stats.active,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Applicants',
      value: stats.applicants,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-800 font-medium">Failed to load dashboard</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
          <button onClick={fetchDashboardData} className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's an overview of your internship activity.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center ${card.color} flex-shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            <Link
              to="/software-house/applications"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 text-sm">No applications yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 text-gray-500 font-medium">Applicant</th>
                    <th className="text-left pb-3 text-gray-500 font-medium">Internship</th>
                    <th className="text-left pb-3 text-gray-500 font-medium">Date</th>
                    <th className="text-left pb-3 text-gray-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5">
                        <p className="font-medium text-gray-900">{app.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-gray-400 text-xs">{app.profiles?.email || ''}</p>
                      </td>
                      <td className="py-3.5 text-gray-600 max-w-[160px] truncate">{app.internships?.title || '—'}</td>
                      <td className="py-3.5 text-gray-500 whitespace-nowrap">
                        {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5">
                        <span className={statusBadge(app.status)}>{app.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/software-house/post-internship')}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 transition font-medium"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post New Internship
            </button>

            <button
              onClick={() => navigate('/software-house/applications')}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              <svg className="w-5 h-5 flex-shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              View Applications
            </button>

            <button
              onClick={() => navigate('/software-house/internships')}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              <svg className="w-5 h-5 flex-shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Internships
            </button>

            <button
              onClick={() => navigate('/software-house/analytics')}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              <svg className="w-5 h-5 flex-shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </button>
          </div>

          {/* Summary mini-stats */}
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Approval Rate</span>
              <span className="font-semibold text-gray-900">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
