import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected']

export default function MyInternships() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [internships, setInternships] = useState([])
  const [applicantCounts, setApplicantCounts] = useState({})
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    if (user?.id) fetchInternships()
  }, [user?.id])

  async function fetchInternships() {
    try {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('internships')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (err) throw err

      setInternships(data || [])

      // Fetch applicant counts per internship
      if (data && data.length > 0) {
        const ids = data.map(i => i.id)
        const { data: apps, error: appsErr } = await supabase
          .from('applications')
          .select('internship_id')
          .in('internship_id', ids)

        if (!appsErr && apps) {
          const counts = {}
          apps.forEach(a => {
            counts[a.internship_id] = (counts[a.internship_id] || 0) + 1
          })
          setApplicantCounts(counts)
        }
      }
    } catch (err) {
      console.error('MyInternships fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this internship? This action cannot be undone.')) return

    try {
      setDeletingId(id)
      setDeleteError(null)

      const { error: err } = await supabase
        .from('internships')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id)

      if (err) throw err

      setInternships(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
      setDeleteError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = activeTab === 'all'
    ? internships
    : internships.filter(i => i.status === activeTab)

  const tabCount = (tab) => tab === 'all'
    ? internships.length
    : internships.filter(i => i.status === tab).length

  const statusBadge = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-700 border border-amber-200',
      approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      rejected: 'bg-rose-100 text-rose-700 border border-rose-200',
    }
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading internships...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-md">
          <p className="text-gray-800 font-medium">Failed to load internships</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
          <button onClick={fetchInternships} className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Internships</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your posted internship listings.</p>
        </div>
        <button
          onClick={() => navigate('/software-house/post-internship')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Post New
        </button>
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-xl border border-gray-100 p-1.5 w-fit shadow-sm">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeTab === tab ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {tabCount(tab)}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400 font-medium">No internships found</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'all' ? 'Post your first internship to get started.' : `No ${activeTab} internships.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-gray-500 font-medium">Title</th>
                  <th className="text-left px-5 py-3.5 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-5 py-3.5 text-gray-500 font-medium">Applicants</th>
                  <th className="text-left px-5 py-3.5 text-gray-500 font-medium">Location</th>
                  <th className="text-left px-5 py-3.5 text-gray-500 font-medium">Posted</th>
                  <th className="text-right px-5 py-3.5 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((internship) => (
                  <tr key={internship.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{internship.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{internship.duration}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={statusBadge(internship.status)}>{internship.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-900">{applicantCounts[internship.id] || 0}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{internship.location || '—'}</td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(internship.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('/software-house/applications', { state: { internshipId: internship.id } })}
                          className="text-xs px-3 py-1.5 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                        >
                          Applications
                        </button>
                        <button
                          onClick={() => handleDelete(internship.id)}
                          disabled={deletingId === internship.id}
                          className="text-xs px-3 py-1.5 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition disabled:opacity-50"
                        >
                          {deletingId === internship.id ? '...' : 'Delete'}
                        </button>
                      </div>
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
