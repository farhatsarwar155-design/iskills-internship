import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Trash2,
  X,
} from 'lucide-react'

const STATUS_OPTIONS = [
  { id: 'all', label: 'All Applications' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
]

export default function Applications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApp, setSelectedApp] = useState(null)
  const [withdrawTarget, setWithdrawTarget] = useState(null)
  const [toast, setToast] = useState(null)

  // Fetch applications for the authenticated student or guest user
  const {
    data: applications = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['my-applications', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error: fetchErr } = await supabase
        .from('applications')
        .select(`
          id,
          user_id,
          internship_id,
          status,
          cover_letter,
          feedback,
          created_at,
          updated_at,
          internships:internship_id (
            id,
            title,
            description,
            requirements,
            duration,
            location,
            stipend,
            status,
            created_by,
            profiles:created_by (
              organization_name,
              email
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr
      return data || []
    },
    enabled: !!user?.id,
  })

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (appId) => {
      const { error: delErr } = await supabase
        .from('applications')
        .delete()
        .eq('id', appId)
        .eq('user_id', user.id)

      if (delErr) throw delErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-applications', user?.id])
      setWithdrawTarget(null)
      if (selectedApp?.id === withdrawTarget?.id) {
        setSelectedApp(null)
      }
      setToast({ type: 'success', message: 'Application withdrawn successfully.' })
      setTimeout(() => setToast(null), 3500)
    },
    onError: (err) => {
      setToast({ type: 'error', message: err.message || 'Failed to withdraw application.' })
    },
  })

  // Derived counts
  const totalCount = applications.length
  const pendingCount = applications.filter((a) => a.status === 'pending').length
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter

      const q = searchTerm.toLowerCase().trim()
      const title = app.internships?.title?.toLowerCase() || ''
      const org = app.internships?.profiles?.organization_name?.toLowerCase() || ''
      const loc = app.internships?.location?.toLowerCase() || ''

      const matchesSearch = !q || title.includes(q) || org.includes(q) || loc.includes(q)

      return matchesStatus && matchesSearch
    })
  }, [applications, statusFilter, searchTerm])

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Accepted</span>
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rejected</span>
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Review</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-indigo-100/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Application Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-sm text-gray-600 max-w-xl">
            Track real-time status updates, review hiring feedback, and monitor responses from software houses.
          </p>
        </div>

        <Link
          to="/listings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all self-start md:self-auto"
        >
          <Search className="w-4 h-4" />
          <span>Browse More Internships</span>
        </Link>
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 text-sm font-medium border animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Applied</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{isLoading ? '—' : totalCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Review</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{isLoading ? '—' : pendingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Accepted Offers</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{isLoading ? '—' : acceptedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rejected</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{isLoading ? '—' : rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* ── Search & Status Filters Bar ── */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = statusFilter === opt.id
              let count = totalCount
              if (opt.id === 'pending') count = pendingCount
              if (opt.id === 'accepted') count = acceptedCount
              if (opt.id === 'rejected') count = rejectedCount

              return (
                <button
                  key={opt.id}
                  onClick={() => setStatusFilter(opt.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700 shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Field */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, company..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Applications Content ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading your applications...</p>
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="font-bold text-rose-900 text-base">Failed to load applications</h3>
          <p className="text-xs text-rose-700">{error?.message || 'Please refresh or try again later.'}</p>
        </div>
      ) : filteredApps.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">No applications found</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {searchTerm || statusFilter !== 'all'
                ? 'No applications match your selected filters. Try resetting the search or filter.'
                : "You haven't submitted any internship applications yet. Explore active listings to get started."}
            </p>
          </div>
          {searchTerm || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset all filters
            </button>
          ) : (
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explore Available Listings</span>
            </Link>
          )}
        </div>
      ) : (
        /* Applications List Cards */
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const internship = app.internships || {}
            const orgName = internship.profiles?.organization_name || 'Software House'
            const isPending = app.status === 'pending'

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 sm:p-6 hover:shadow-md hover:border-blue-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Role Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {internship.title || 'Internship Position'}
                    </h3>
                    <div>{renderStatusBadge(app.status)}</div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-indigo-600">
                    <Building className="w-3.5 h-3.5" />
                    <span>{orgName}</span>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1">
                    {internship.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{internship.location}</span>
                      </span>
                    )}
                    {internship.duration && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{internship.duration}</span>
                      </span>
                    )}
                    {internship.stipend && (
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        <DollarSign className="w-3 h-3" />
                        <span>{internship.stipend}</span>
                      </span>
                    )}
                    <span className="text-gray-400">
                      Applied: {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Feedback Snippet if available */}
                  {app.feedback && (
                    <div className="mt-2 text-xs bg-blue-50/80 border border-blue-100 text-blue-900 rounded-lg p-2.5 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Employer Feedback: </span>
                        <span>{app.feedback}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {isPending && (
                    <button
                      onClick={() => setWithdrawTarget(app)}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                      title="Withdraw application"
                    >
                      Withdraw
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedApp(app)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-semibold transition"
                  >
                    <span>View Submission</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedApp.internships?.title || 'Internship Application Details'}
                </h2>
                <p className="text-xs text-indigo-600 font-medium">
                  {selectedApp.internships?.profiles?.organization_name || 'Software House'}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status Header Block */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Application Status</p>
                  <div className="mt-1">{renderStatusBadge(selectedApp.status)}</div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>Submitted on</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(selectedApp.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Employer Feedback Block (if any) */}
              {selectedApp.feedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Hiring Team Note / Decision Feedback</span>
                  </div>
                  <p className="text-xs text-blue-950 leading-relaxed pt-1">{selectedApp.feedback}</p>
                </div>
              )}

              {/* Submitted Cover Letter */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Submitted Cover Letter
                </h4>
                <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-4 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                  {selectedApp.cover_letter?.trim() || (
                    <span className="text-gray-400 italic">No cover letter was submitted with this application.</span>
                  )}
                </div>
              </div>

              {/* Internship Information */}
              {selectedApp.internships && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Role Description & Requirements
                  </h4>
                  {selectedApp.internships.description && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {selectedApp.internships.description}
                    </p>
                  )}
                  {selectedApp.internships.requirements && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3">
                      <p className="text-[11px] font-semibold text-indigo-900 uppercase">Requirements:</p>
                      <p className="text-xs text-indigo-950 mt-0.5">{selectedApp.internships.requirements}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <Link
                to="/cv"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View & Update My CV</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Withdraw Confirmation Modal ── */}
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Withdraw Application?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to withdraw your application for{' '}
                <span className="font-semibold text-gray-800">
                  {withdrawTarget.internships?.title || 'this internship'}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWithdrawTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => withdrawMutation.mutate(withdrawTarget.id)}
                disabled={withdrawMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-lg shadow-sm transition"
              >
                {withdrawMutation.isPending ? 'Withdrawing...' : 'Yes, Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
