import React, { useState, useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Users,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Eye,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  Mail,
  Building,
  GraduationCap,
  Calendar,
  X,
  Sparkles,
  RefreshCw,
  Award,
  Check,
  AlertTriangle,
  Code,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Phone
} from 'lucide-react'

export default function ManageApplications() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Selected internship from navigation state or default to 'all'
  const initialInternshipId = location.state?.internshipId || 'all'
  const [selectedInternshipId, setSelectedInternshipId] = useState(initialInternshipId)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'accepted' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'oldest' | 'name'

  // Modal / Drawer state for viewing applicant details, cover letter & CV
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [actionConfirm, setActionConfirm] = useState(null) // { app, action: 'accepted' | 'rejected' } | null
  const [processingId, setProcessingId] = useState(null)

  // 1. Fetch internships created by this software house
  const {
    data: internships = [],
    isLoading: isLoadingInternships,
    error: internshipsError,
    refetch: refetchInternships,
  } = useQuery({
    queryKey: ['software-house-internships', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internships')
        .select('id, title, status, location, duration, stipend, requirements, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })

  const internshipIds = useMemo(() => internships.map((i) => i.id), [internships])

  // 2. Fetch applications for these internships
  const {
    data: applications = [],
    isLoading: isLoadingApplications,
    error: applicationsError,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ['software-house-applications', internshipIds],
    enabled: internshipIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('id, user_id, internship_id, status, cover_letter, created_at, updated_at')
        .in('internship_id', internshipIds)

      if (error) throw error
      let apps = data || []
      const userIds = [...new Set(apps.map((a) => a.user_id).filter(Boolean))]
      let profileMap = {}
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_picture, university_id')
          .in('id', userIds)
        profileMap = (profilesData || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
      }

      const internshipMap = (internships || []).reduce((acc, i) => ({ ...acc, [i.id]: i }), {})

      apps = apps.map((a) => ({
        ...a,
        profiles: profileMap[a.user_id] || {},
        internships: internshipMap[a.internship_id] || {},
      }))
      return apps
    },
  })

  // 3. Fetch CV data for the selected applicant when modal opens
  const { data: applicantCv, isLoading: isLoadingCv } = useQuery({
    queryKey: ['applicant-cv-data', selectedApplicant?.user_id],
    enabled: !!selectedApplicant?.user_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cv_data')
        .select('*')
        .eq('user_id', selectedApplicant.user_id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.warn('Could not fetch CV data:', error)
        return null
      }
      return data || null
    },
  })

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, applicantUserId, newStatus, internshipTitle, internshipId }) => {
      setProcessingId(applicationId)

      // 1. Update application in applications table
      const { error: appError } = await supabase
        .from('applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)

      if (appError) throw appError

      // 2. Insert notification for the applicant
      const orgName = profile?.organization_name || profile?.full_name || 'Software House'
      const title = newStatus === 'accepted'
        ? 'Application Accepted! 🎉'
        : 'Application Status Update'
      const message = `Your application for "${internshipTitle || 'Internship'}" at ${orgName} has been ${newStatus}.`

      try {
        await supabase.from('notifications').insert({
          user_id: applicantUserId,
          type: 'application_status',
          title,
          message,
          metadata: {
            internship_id: internshipId,
            internship_title: internshipTitle,
            status: newStatus,
            software_house_name: orgName,
            application_id: applicationId,
          },
          is_read: false,
        })
      } catch (notifErr) {
        console.warn('[ManageApplications] Failed to send notification (non-fatal):', notifErr)
      }

      return { applicationId, newStatus }
    },
    onSuccess: ({ newStatus }) => {
      queryClient.invalidateQueries(['software-house-applications'])
      queryClient.invalidateQueries(['software-house-internships'])
      toast.success(`Application marked as ${newStatus}!`)
      setActionConfirm(null)
      if (selectedApplicant) {
        setSelectedApplicant((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    },
    onError: (err) => {
      console.error('[ManageApplications] Status update error:', err)
      toast.error(err.message || 'Failed to update application status')
    },
    onSettled: () => {
      setProcessingId(null)
    },
  })

  const handleUpdateStatus = (app, newStatus) => {
    const title = app.internships?.title || 'Internship'
    updateStatusMutation.mutate({
      applicationId: app.id,
      applicantUserId: app.user_id,
      newStatus,
      internshipTitle: title,
      internshipId: app.internship_id,
    })
  }

  // Count metrics for the selected internship (or all)
  const stats = useMemo(() => {
    const relevant = selectedInternshipId === 'all'
      ? applications
      : applications.filter((a) => a.internship_id === selectedInternshipId)

    const total = relevant.length
    const pending = relevant.filter((a) => a.status === 'pending').length
    const accepted = relevant.filter((a) => a.status === 'accepted').length
    const rejected = relevant.filter((a) => a.status === 'rejected').length

    return { total, pending, accepted, rejected }
  }, [applications, selectedInternshipId])

  // Filtered & Sorted applications
  const filteredApplications = useMemo(() => {
    let list = [...applications]

    // Filter by internship
    if (selectedInternshipId !== 'all') {
      list = list.filter((a) => a.internship_id === selectedInternshipId)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((a) => {
        const name = (a.profiles?.full_name || '').toLowerCase()
        const email = (a.profiles?.email || '').toLowerCase()
        const title = (a.internships?.title || '').toLowerCase()
        const cover = (a.cover_letter || '').toLowerCase()
        return name.includes(q) || email.includes(q) || title.includes(q) || cover.includes(q)
      })
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      if (sortBy === 'name') {
        const nameA = a.profiles?.full_name || ''
        const nameB = b.profiles?.full_name || ''
        return nameA.localeCompare(nameB)
      }
      return 0
    })

    return list
  }, [applications, selectedInternshipId, statusFilter, searchQuery, sortBy])

  const statusBadge = (status) => {
    const map = {
      pending: {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />,
        label: 'Pending Review',
      },
      accepted: {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />,
        label: 'Accepted',
      },
      rejected: {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />,
        label: 'Rejected',
      },
    }
    const current = map[status] || {
      bg: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: null,
      label: status || 'Unknown',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg}`}>
        {current.icon}
        {current.label}
      </span>
    )
  }

  const isLoading = isLoadingInternships || isLoadingApplications
  const currentInternshipObj = internships.find((i) => i.id === selectedInternshipId)

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Applicant Pipeline
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-100">
                {applications.length} Total Submissions
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Manage Applications</h1>
            <p className="mt-1 text-blue-100 text-sm max-w-2xl">
              Filter candidates by internship listing, inspect detailed cover letters and CV profiles, and process hiring decisions with automated applicant notifications.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => {
                refetchInternships()
                refetchApplications()
                toast.success('Applications refreshed!')
              }}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl border border-white/20 transition-all cursor-pointer shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/internships/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              Post Internship
            </Link>
          </div>
        </div>
      </div>

      {/* ── Top Controls: Internship Dropdown Selector & Pipeline Counters ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Internship Dropdown Filter */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-xl">
            <label htmlFor="internshipSelect" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Select Internship Listing
            </label>
            <div className="relative">
              <select
                id="internshipSelect"
                value={selectedInternshipId}
                onChange={(e) => setSelectedInternshipId(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="all">
                  🌟 All Posted Internships ({internships.length} listings • {applications.length} applicants)
                </option>
                {internships.map((int) => {
                  const count = applications.filter((a) => a.internship_id === int.id).length
                  return (
                    <option key={int.id} value={int.id}>
                      {int.title} ({count} {count === 1 ? 'applicant' : 'applicants'}) — [{int.status.toUpperCase()}]
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {currentInternshipObj && selectedInternshipId !== 'all' && (
            <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 shrink-0">
              <div>
                <span className="text-gray-400 block font-medium">Location</span>
                <span className="font-semibold text-gray-800">{currentInternshipObj.location || 'Remote / Hybrid'}</span>
              </div>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <span className="text-gray-400 block font-medium">Duration</span>
                <span className="font-semibold text-gray-800">{currentInternshipObj.duration || '3 Months'}</span>
              </div>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <span className="text-gray-400 block font-medium">Stipend</span>
                <span className="font-semibold text-emerald-600">{currentInternshipObj.stipend || 'Unpaid'}</span>
              </div>
            </div>
          )}
        </div>

        {/* 4 Stat Cards */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Received</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.total}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{selectedInternshipId === 'all' ? 'All listings' : 'This listing'}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{stats.pending}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Awaiting decision</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Accepted / Hired</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{stats.accepted}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Offer extended</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Declined</p>
            <h3 className="text-2xl font-black text-rose-700 mt-1">{stats.rejected}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Rejected candidates</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Search, Status Filters & Sort Toolbar ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Applicants', count: stats.total },
              { id: 'pending', label: 'Pending', count: stats.pending },
              { id: 'accepted', label: 'Accepted', count: stats.accepted },
              { id: 'rejected', label: 'Rejected', count: stats.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    statusFilter === tab.id
                      ? 'bg-white/25 text-white'
                      : 'bg-gray-200/70 text-gray-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input & Sort Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search candidate name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer pr-2"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Applicant Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Applications Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-500">Loading candidate applications...</p>
          </div>
        ) : internships.length === 0 ? (
          <div className="py-16 px-6 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Internships Posted Yet</h3>
            <p className="text-xs text-gray-500 mt-1 mb-5">
              Create and post your first internship listing so students across affiliated universities can submit their applications.
            </p>
            <Link
              to="/internships/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition"
            >
              <Briefcase className="w-4 h-4" />
              Post an Internship Listing
            </Link>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-16 px-6 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Applicants Found</h3>
            <p className="text-xs text-gray-500 mt-1">
              {searchQuery
                ? `No candidates match your search query "${searchQuery}".`
                : statusFilter !== 'all'
                ? `No applications with status "${statusFilter}".`
                : 'No applicants have applied to this internship listing yet.'}
            </p>
            {(searchQuery || statusFilter !== 'all' || selectedInternshipId !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setSelectedInternshipId('all')
                }}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-5">Candidate</th>
                  <th className="py-3.5 px-5">Internship Listing</th>
                  <th className="py-3.5 px-5">Applied Date</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Cover Letter</th>
                  <th className="py-3.5 px-5 text-right">Decision Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredApplications.map((app) => {
                  const applicantName = app.profiles?.full_name || 'Anonymous Student'
                  const applicantEmail = app.profiles?.email || 'No email registered'
                  const initials = applicantName.slice(0, 2).toUpperCase()
                  const appliedDate = new Date(app.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                  const isProcessing = processingId === app.id

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* Candidate Name & Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => setSelectedApplicant(app)}
                              className="font-bold text-gray-900 hover:text-blue-600 transition text-left truncate block max-w-[180px] cursor-pointer"
                            >
                              {applicantName}
                            </button>
                            <span className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                              {applicantEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Internship Title */}
                      <td className="py-4 px-5">
                        <div className="max-w-[200px]">
                          <p className="font-semibold text-gray-900 truncate">
                            {app.internships?.title || 'Unknown Position'}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {app.internships?.location || 'Remote'}
                          </p>
                        </div>
                      </td>

                      {/* Applied Date */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-700 block">{appliedDate}</span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(app.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {statusBadge(app.status)}
                      </td>

                      {/* Cover Letter Button */}
                      <td className="py-4 px-5">
                        <button
                          onClick={() => setSelectedApplicant(app)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 text-xs font-semibold transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Inspect Letter</span>
                        </button>
                      </td>

                      {/* Decision Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Full Profile / CV */}
                          <button
                            onClick={() => setSelectedApplicant(app)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Full Profile & CV"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Accept Button */}
                          <button
                            onClick={() => handleUpdateStatus(app, 'accepted')}
                            disabled={isProcessing || app.status === 'accepted'}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer ${
                              app.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800 opacity-60 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow'
                            } disabled:opacity-50`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{app.status === 'accepted' ? 'Accepted' : 'Accept'}</span>
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() => handleUpdateStatus(app, 'rejected')}
                            disabled={isProcessing || app.status === 'rejected'}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              app.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800 opacity-60 cursor-not-allowed'
                                : 'bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300'
                            } disabled:opacity-50`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{app.status === 'rejected' ? 'Declined' : 'Reject'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Applicant Detail / Cover Letter Modal / Drawer ── */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm text-white font-black flex items-center justify-center text-base border border-white/20 shadow-sm">
                  {(selectedApplicant.profiles?.full_name || 'S').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">
                      {selectedApplicant.profiles?.full_name || 'Applicant Profile'}
                    </h2>
                    {statusBadge(selectedApplicant.status)}
                  </div>
                  <p className="text-xs text-blue-100 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {selectedApplicant.profiles?.email || 'N/A'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {selectedApplicant.internships?.title || 'Internship'}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApplicant(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800 text-sm">
              {/* Application Snapshot Bar */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Applied On</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(selectedApplicant.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Position</span>
                  <span className="font-semibold text-gray-800 truncate block">
                    {selectedApplicant.internships?.title || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Location</span>
                  <span className="font-semibold text-gray-800">
                    {selectedApplicant.internships?.location || 'Remote'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Monthly Stipend</span>
                  <span className="font-semibold text-emerald-600">
                    {selectedApplicant.internships?.stipend || 'Unpaid'}
                  </span>
                </div>
              </div>

              {/* Cover Letter Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Cover Letter & Submission Note
                  </h3>
                  {selectedApplicant.cover_letter && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedApplicant.cover_letter)
                        toast.success('Cover letter copied to clipboard!')
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Copy text
                    </button>
                  )}
                </div>

                <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100/70 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedApplicant.cover_letter ? (
                    selectedApplicant.cover_letter
                  ) : (
                    <p className="text-gray-400 italic">No formal cover letter submitted with this application.</p>
                  )}
                </div>
              </div>

              {/* Applicant CV Data (Skills, Education, Experience) */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Candidate Background & CV Details
                </h3>

                {isLoadingCv ? (
                  <div className="py-6 text-center">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Loading CV details...</p>
                  </div>
                ) : applicantCv ? (
                  <div className="space-y-4">
                    {/* Bio / Summary */}
                    {applicantCv.personal?.summary && (
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs text-gray-700">
                        <span className="font-semibold text-gray-900 block mb-1">Professional Summary</span>
                        {applicantCv.personal.summary}
                      </div>
                    )}

                    {/* Skills */}
                    {applicantCv.skills && (
                      <div>
                        <span className="text-xs font-semibold text-gray-700 block mb-2">Technical Skills & Tools</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(applicantCv.skills)
                            ? applicantCv.skills
                            : String(applicantCv.skills).split(',')
                          ).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                            >
                              {typeof skill === 'string' ? skill.trim() : skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {Array.isArray(applicantCv.education) && applicantCv.education.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-gray-700 block mb-2">Education</span>
                        <div className="space-y-2">
                          {applicantCv.education.map((edu, eIdx) => (
                            <div key={eIdx} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs flex justify-between items-start">
                              <div>
                                <p className="font-bold text-gray-900">{edu.degree || edu.institution || 'Degree Program'}</p>
                                <p className="text-gray-500">{edu.institution || edu.field_of_study}</p>
                              </div>
                              <span className="text-[11px] text-gray-400 font-medium">
                                {edu.start_year || edu.startYear} - {edu.end_year || edu.endYear || 'Present'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {Array.isArray(applicantCv.experience) && applicantCv.experience.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-gray-700 block mb-2">Past Experience & Projects</span>
                        <div className="space-y-2">
                          {applicantCv.experience.map((exp, xIdx) => (
                            <div key={xIdx} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                              <div className="flex justify-between items-start">
                                <p className="font-bold text-gray-900">{exp.title || exp.position}</p>
                                <span className="text-[11px] text-gray-400 font-medium">
                                  {exp.duration || `${exp.start_date || ''} - ${exp.end_date || 'Present'}`}
                                </span>
                              </div>
                              <p className="text-gray-600 mt-0.5">{exp.company || exp.organization}</p>
                              {exp.description && <p className="text-gray-500 mt-1 text-[11px]">{exp.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 text-center">
                    Candidate has not created a structured digital CV profile yet.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Updating status automatically notifies the applicant.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedApplicant(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-200 transition"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedApplicant, 'rejected')}
                  disabled={processingId === selectedApplicant.id || selectedApplicant.status === 'rejected'}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                >
                  Decline Candidate
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedApplicant, 'accepted')}
                  disabled={processingId === selectedApplicant.id || selectedApplicant.status === 'accepted'}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  Accept Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
