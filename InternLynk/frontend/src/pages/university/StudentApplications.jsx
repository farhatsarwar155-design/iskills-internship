import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'

const STATUS_FILTERS = ['all', 'pending', 'accepted', 'rejected']

export default function StudentApplications() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState('all')

  // First: get student IDs for this university
  const { data: studentIds = [] } = useQuery({
    queryKey: ['university-student-ids', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('university_id', user.id)
        .eq('role', 'student')
      if (error) throw error
      return (data ?? []).map((s) => s.id)
    },
  })

  // Then: fetch all applications for those students with joined data
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['university-all-applications', studentIds],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          user_id,
          profiles!applications_user_id_fkey(full_name, email),
          internships(title, location, created_by, profiles!internships_created_by_fkey(organization_name))
        `)
        .in('user_id', studentIds)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const filtered = statusFilter === 'all'
    ? applications
    : applications.filter((a) => a.status === statusFilter)

  const statusBadge = (s) => {
    const map = {
      accepted: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-amber-100 text-amber-700',
      rejected: 'bg-rose-100 text-rose-700',
    }
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${map[s] || 'bg-gray-100 text-gray-600'}`}>
        {s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-100">
        <h1 className="text-2xl font-bold text-gray-900">Student Applications</h1>
        <p className="text-gray-500 mt-1">All internship applications submitted by your university's students.</p>
      </div>

      {/* Filters + hint */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === f
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Export hint */}
          <p className="text-xs text-gray-400 italic flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            To export: right-click the table → copy, or use browser print.
          </p>
        </div>

        {/* Count */}
        <p className="text-sm text-gray-500 mb-4">
          Showing <strong>{filtered.length}</strong> application{filtered.length !== 1 ? 's' : ''}
          {statusFilter !== 'all' && ` with status "${statusFilter}"`}
        </p>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-rose-500">Failed to load applications: {error.message}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            </svg>
            No applications found{statusFilter !== 'all' ? ` for "${statusFilter}"` : ''}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Student</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Internship</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Company</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Date Applied</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-900">{app.profiles?.full_name || '—'}</div>
                      <div className="text-xs text-gray-400">{app.profiles?.email}</div>
                    </td>
                    <td className="py-3 px-3 text-gray-700">{app.internships?.title || '—'}</td>
                    <td className="py-3 px-3 text-gray-600">{app.internships?.profiles?.organization_name || '—'}</td>
                    <td className="py-3 px-3">{statusBadge(app.status)}</td>
                    <td className="py-3 px-3 text-gray-400">{new Date(app.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
