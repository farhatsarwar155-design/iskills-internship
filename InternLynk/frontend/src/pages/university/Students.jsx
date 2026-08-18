import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Students() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['university-students-list', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, approval_status, created_at')
        .eq('university_id', user.id)
        .eq('role', 'student')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return (
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    )
  })

  const statusBadge = (s) => {
    if (s.is_active)
      return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">Active</span>
    if (s.approval_status === 'pending')
      return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>
    if (s.approval_status === 'rejected')
      return <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700 font-medium">Rejected</span>
    return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium">Inactive</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-100">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-500 mt-1">Manage and view all students registered under your university.</p>
      </div>

      {/* Search + Count */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <span className="text-sm text-gray-500 shrink-0">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-rose-500">Failed to load students: {error.message}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
            {search ? 'No students match your search.' : 'No students yet. Use Bulk Upload to add students.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Joined</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => navigate(`/university/students/${student.id}`)}
                    className="border-b border-gray-50 hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 font-medium text-gray-900">
                      {student.full_name || <span className="text-gray-400 italic">No name</span>}
                    </td>
                    <td className="py-3 px-3 text-gray-600">{student.email}</td>
                    <td className="py-3 px-3 text-gray-400">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">{statusBadge(student)}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/university/students/${student.id}`)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium underline-offset-2 hover:underline"
                      >
                        View
                      </button>
                    </td>
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
