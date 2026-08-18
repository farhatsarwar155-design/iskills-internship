import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../utils/supabase'

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value || <span className="text-gray-400 italic">—</span>}</span>
    </div>
  )
}

export default function StudentDetail() {
  const { userId } = useParams()

  // Student profile
  const { data: student, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['student-profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, approval_status, created_at, role')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
  })

  // Applications
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['student-applications', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('id, status, created_at, cover_letter, internship_id, internships(title, location, stipend, created_by, profiles!internships_created_by_fkey(organization_name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  // CV data
  const { data: cvData } = useQuery({
    queryKey: ['student-cv', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cv_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const statusBadge = (status, isActive) => {
    if (isActive) return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">Active</span>
    if (status === 'pending') return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>
    if (status === 'rejected') return <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700 font-medium">Rejected</span>
    return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 font-medium">Inactive</span>
  }

  const appStatusBadge = (s) => {
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

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (profileError || !student) {
    return (
      <div className="text-center py-20 text-rose-500">
        <p>Could not load student profile.</p>
        <Link to="/university/students" className="text-blue-600 mt-2 inline-block hover:underline text-sm">
          ← Back to Students
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1">
        <Link to="/university/students" className="hover:text-blue-600 transition-colors">Students</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{student.full_name || student.email}</span>
      </nav>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <span className="text-xl font-bold text-white">
              {(student.full_name || student.email || 'S')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{student.full_name || <span className="italic text-gray-400">No name</span>}</h1>
            <p className="text-sm text-gray-500">{student.email}</p>
            <div className="mt-1">{statusBadge(student.approval_status, student.is_active)}</div>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          <InfoRow label="Email" value={student.email} />
          <InfoRow label="Role" value={student.role} />
          <InfoRow label="Joined" value={new Date(student.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
          <InfoRow label="Approval Status" value={student.approval_status} />
          <InfoRow label="Account Active" value={student.is_active ? 'Yes' : 'No'} />
        </div>
      </div>

      {/* CV Data */}
      {cvData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">CV / Profile Data</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {cvData.skills && (
              <div>
                <p className="text-gray-500 mb-1 font-medium">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(cvData.skills) ? cvData.skills : cvData.skills.split(',')).map((sk, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">{sk.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            {cvData.education && (
              <div>
                <p className="text-gray-500 mb-1 font-medium">Education</p>
                <p className="text-gray-900">{typeof cvData.education === 'object' ? JSON.stringify(cvData.education) : cvData.education}</p>
              </div>
            )}
            {cvData.experience && (
              <div>
                <p className="text-gray-500 mb-1 font-medium">Experience</p>
                <p className="text-gray-900">{typeof cvData.experience === 'object' ? JSON.stringify(cvData.experience) : cvData.experience}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Applications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Applications
          <span className="ml-2 text-sm font-normal text-gray-400">({applications.length})</span>
        </h2>

        {appsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : applications.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">This student has not submitted any applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Internship</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Company</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-900 font-medium">{app.internships?.title || '—'}</td>
                    <td className="py-2 px-3 text-gray-600">
                      {app.internships?.profiles?.organization_name || '—'}
                    </td>
                    <td className="py-2 px-3">{appStatusBadge(app.status)}</td>
                    <td className="py-2 px-3 text-gray-400">
                      {new Date(app.created_at).toLocaleDateString()}
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
