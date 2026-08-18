import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  // Fetch all students belonging to this university
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['university-students', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, created_at, approval_status')
        .eq('university_id', user.id)
        .eq('role', 'student')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  // Fetch applications for those students
  const studentIds = students.map((s) => s.id)
  const { data: applications = [] } = useQuery({
    queryKey: ['university-applications', studentIds],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('id, status, user_id')
        .in('user_id', studentIds)
      if (error) throw error
      return data ?? []
    },
  })

  const totalStudents = students.length
  const activeStudents = students.filter((s) => s.is_active).length
  const totalApplications = applications.length

  const recentStudents = students.slice(0, 8)

  const statusBadge = (s) => {
    if (s.is_active) return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">Active</span>
    if (s.approval_status === 'pending') return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>
    return <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700 font-medium">Inactive</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-100">
        <h1 className="text-2xl font-bold text-gray-900">University Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your students and their internship activity.</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Students"
            value={totalStudents}
            color="bg-blue-100"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
              </svg>
            }
          />
          <StatCard
            label="Active Students"
            value={activeStudents}
            color="bg-emerald-100"
            icon={
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Applications Submitted"
            value={totalApplications}
            color="bg-indigo-100"
            icon={
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/bulk-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Bulk Upload Students
          </Link>
          <Link
            to="/university/applications"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            </svg>
            View Applications
          </Link>
          <Link
            to="/university/students"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
            Manage Students
          </Link>
        </div>
      </div>

      {/* Recent Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Recent Students</h2>
          <Link to="/university/students" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : recentStudents.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
            <p>No students yet. Use Bulk Upload to add students.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((student) => (
                  <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-3 font-medium text-gray-900">{student.full_name || '—'}</td>
                    <td className="py-2 px-3 text-gray-600">{student.email}</td>
                    <td className="py-2 px-3">{statusBadge(student)}</td>
                    <td className="py-2 px-3 text-gray-400">
                      {new Date(student.created_at).toLocaleDateString()}
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
