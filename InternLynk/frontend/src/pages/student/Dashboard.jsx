import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'

// ─── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:  'bg-amber-100 text-amber-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}

export default function StudentDashboard() {
  const { user, profile } = useAuth()

  // Fetch applications with joined internship title
  const { data: applications = [], isLoading, isError } = useQuery({
    queryKey: ['student-applications', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('applications')
        .select('id, status, created_at, internship_id, internships(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!user?.id,
  })

  // Derived stats
  const total    = applications.length
  const pending  = applications.filter(a => a.status === 'pending').length
  const accepted = applications.filter(a => a.status === 'accepted').length
  const rejected = applications.filter(a => a.status === 'rejected').length

  const recentApps = applications.slice(0, 5)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student'

  return (
    <div className="space-y-8">

      {/* ── Welcome header ── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
        <h1 className="text-2xl font-bold">Welcome back, {firstName}! 👋</h1>
        <p className="mt-1 text-blue-100 text-sm">
          Track your internship applications and find new opportunities.
        </p>
        <Link
          to="/listings"
          className="mt-4 inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-lg text-sm shadow-sm hover:bg-blue-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Find Internships
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={isLoading ? '—' : total}
          color="bg-blue-50"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Pending"
          value={isLoading ? '—' : pending}
          color="bg-amber-50"
          icon={
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Accepted"
          value={isLoading ? '—' : accepted}
          color="bg-emerald-50"
          icon={
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Rejected"
          value={isLoading ? '—' : rejected}
          color="bg-rose-50"
          icon={
            <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Recent Applications ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Recent Applications</h2>
          <Link to="/applications" className="text-sm text-blue-600 hover:underline font-medium">
            View all
          </Link>
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-sm text-rose-500 text-center py-8">Failed to load applications.</p>
        ) : recentApps.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-gray-500">No applications yet.</p>
            <Link to="/listings" className="mt-3 inline-block text-sm text-blue-600 hover:underline font-medium">
              Browse internships &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Internship</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentApps.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-800">
                      {app.internships?.title ?? 'Untitled Internship'}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(app.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick links ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/cv',           label: 'Update CV',        desc: 'Keep your profile fresh',     icon: '📄' },
          { to: '/listings',     label: 'Find Internships', desc: 'Discover new opportunities',  icon: '🔍' },
          { to: '/applications', label: 'My Applications',  desc: 'Track all your submissions',  icon: '📋' },
        ].map(card => (
          <Link
            key={card.to}
            to={card.to}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-100 transition-all group"
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{card.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
