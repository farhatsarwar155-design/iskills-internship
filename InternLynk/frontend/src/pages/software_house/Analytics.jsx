import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  Filter,
  Calendar,
  Layers,
  FileCheck,
  ChevronRight,
  Eye
} from 'lucide-react'

function StatCard({ title, value, subtext, icon, colorBg, colorText, badgeText, badgeColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorBg} ${colorText} shadow-sm`}>
          {icon}
        </div>
      </div>
      {(subtext || badgeText) && (
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
          <span className="text-gray-500 truncate">{subtext}</span>
          {badgeText && (
            <span className={`px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeColor}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function Analytics() {
  const { user } = useAuth()
  const [timeframe, setTimeframe] = useState('6months') // '30days' | '6months' | 'year' | 'all'

  // 1. Fetch all internships posted by this software house
  const {
    data: internships = [],
    isLoading: isLoadingInternships,
    error: internshipsError,
    refetch: refetchInternships,
  } = useQuery({
    queryKey: ['sh-analytics-internships', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internships')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })

  const internshipIds = useMemo(() => internships.map((i) => i.id), [internships])

  // 2. Fetch all applications for those internships
  const {
    data: applications = [],
    isLoading: isLoadingApplications,
    error: applicationsError,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ['sh-analytics-applications', internshipIds],
    enabled: internshipIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('id, user_id, internship_id, status, created_at, cover_letter')
        .in('internship_id', internshipIds)

      if (error) throw error

      let apps = data || []
      const userIds = [...new Set(apps.map(a => a.user_id).filter(Boolean))]
      let profileMap = {}
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)
        profileMap = (profilesData || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
      }

      const internshipMap = (internships || []).reduce((acc, i) => ({ ...acc, [i.id]: i }), {})

      apps = apps.map(a => ({
        ...a,
        profiles: profileMap[a.user_id] || {},
        internships: internshipMap[a.internship_id] || {},
      }))

      return apps
    },
  })

  // Filter applications by timeframe
  const filteredApplications = useMemo(() => {
    if (timeframe === 'all') return applications
    const now = new Date()
    let cutoff = new Date()

    if (timeframe === '30days') {
      cutoff.setDate(now.getDate() - 30)
    } else if (timeframe === '6months') {
      cutoff.setMonth(now.getMonth() - 6)
    } else if (timeframe === 'year') {
      cutoff.setFullYear(now.getFullYear() - 1)
    }

    return applications.filter((a) => new Date(a.created_at) >= cutoff)
  }, [applications, timeframe])

  // Analytics Computation
  const stats = useMemo(() => {
    const totalInternships = internships.length
    const activeInternships = internships.filter((i) => i.status === 'approved').length
    const pendingInternships = internships.filter((i) => i.status === 'pending').length
    const totalApplications = filteredApplications.length

    // Status counts
    const acceptedCount = filteredApplications.filter((a) => a.status === 'accepted').length
    const pendingCount = filteredApplications.filter((a) => a.status === 'pending').length
    const rejectedCount = filteredApplications.filter((a) => a.status === 'rejected').length

    const acceptanceRate = totalApplications > 0 ? Math.round((acceptedCount / totalApplications) * 100) : 0
    const pendingRate = totalApplications > 0 ? Math.round((pendingCount / totalApplications) * 100) : 0
    const rejectionRate = totalApplications > 0 ? Math.round((rejectedCount / totalApplications) * 100) : 0

    const avgApplicantsPerInternship = totalInternships > 0 ? (totalApplications / totalInternships).toFixed(1) : '0'

    // Applications Per Internship Breakdown (Custom Bar Chart Data)
    const perInternshipStats = internships.map((int) => {
      const appsForThis = filteredApplications.filter((a) => a.internship_id === int.id)
      const total = appsForThis.length
      const accepted = appsForThis.filter((a) => a.status === 'accepted').length
      const pending = appsForThis.filter((a) => a.status === 'pending').length
      const rejected = appsForThis.filter((a) => a.status === 'rejected').length
      const conversion = total > 0 ? Math.round((accepted / total) * 100) : 0

      return {
        id: int.id,
        title: int.title,
        status: int.status,
        location: int.location,
        total,
        accepted,
        pending,
        rejected,
        conversion,
      }
    }).sort((a, b) => b.total - a.total)

    const maxApplicantsInAnyListing = Math.max(...perInternshipStats.map((i) => i.total), 1)

    // Monthly Trends (Past 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    const monthlyTrends = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth()
      const label = `${monthNames[month]}`

      const monthApps = applications.filter((a) => {
        const appDate = new Date(a.created_at)
        return appDate.getFullYear() === year && appDate.getMonth() === month
      })

      const mTotal = monthApps.length
      const mAccepted = monthApps.filter((a) => a.status === 'accepted').length
      const mPending = monthApps.filter((a) => a.status === 'pending').length
      const mRejected = monthApps.filter((a) => a.status === 'rejected').length

      monthlyTrends.push({
        label,
        year,
        applied: mTotal,
        accepted: mAccepted,
        pending: mPending,
        rejected: mRejected,
      })
    }

    const maxMonthlyApplied = Math.max(...monthlyTrends.map((m) => m.applied), 1)

    // Recent 5 applicants
    const recentCandidates = filteredApplications.slice(0, 5)

    return {
      totalInternships,
      activeInternships,
      pendingInternships,
      totalApplications,
      acceptedCount,
      pendingCount,
      rejectedCount,
      acceptanceRate,
      pendingRate,
      rejectionRate,
      avgApplicantsPerInternship,
      perInternshipStats,
      maxApplicantsInAnyListing,
      monthlyTrends,
      maxMonthlyApplied,
      recentCandidates,
    }
  }, [internships, applications, filteredApplications])

  const isLoading = isLoadingInternships || isLoadingApplications

  const handleRefresh = () => {
    refetchInternships()
    refetchApplications()
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Recruitment Intelligence
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Software House Analytics</h1>
            <p className="mt-1 text-blue-100 text-sm max-w-2xl">
              Gain deep visibility into your applicant pipeline, internship listing traction, and candidate conversion rates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeframe selector */}
            <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1 text-xs">
              {[
                { id: '30days', label: '30 Days' },
                { id: '6months', label: '6 Months' },
                { id: 'year', label: '1 Year' },
                { id: 'all', label: 'All Time' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeframe(t.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    timeframe === t.id
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              className="p-2.5 text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors shadow-sm cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading Spinner ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-500">Calculating your hiring analytics...</p>
        </div>
      ) : (
        <>
          {/* ── Key Metrics Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Internships"
              value={stats.totalInternships}
              subtext={`${stats.activeInternships} active • ${stats.pendingInternships} pending`}
              colorBg="bg-blue-50"
              colorText="text-blue-600"
              badgeText="Postings"
              badgeColor="bg-blue-100 text-blue-700"
              icon={<Briefcase className="w-6 h-6" />}
            />
            <StatCard
              title="Total Applicants"
              value={stats.totalApplications}
              subtext={`${stats.avgApplicantsPerInternship} avg. per internship listing`}
              colorBg="bg-indigo-50"
              colorText="text-indigo-600"
              badgeText={`${stats.pendingCount} Pending`}
              badgeColor="bg-indigo-100 text-indigo-700"
              icon={<Users className="w-6 h-6" />}
            />
            <StatCard
              title="Acceptance Rate"
              value={`${stats.acceptanceRate}%`}
              subtext={`${stats.acceptedCount} applicants accepted`}
              colorBg="bg-emerald-50"
              colorText="text-emerald-600"
              badgeText="Hiring Rate"
              badgeColor="bg-emerald-100 text-emerald-700"
              icon={<Award className="w-6 h-6" />}
            />
            <StatCard
              title="Pending Reviews"
              value={stats.pendingCount}
              subtext={`${stats.rejectedCount} declined (${stats.rejectionRate}%)`}
              colorBg="bg-amber-50"
              colorText="text-amber-600"
              badgeText={`${stats.pendingRate}% Awaiting`}
              badgeColor="bg-amber-100 text-amber-700"
              icon={<Clock className="w-6 h-6" />}
            />
          </div>

          {/* ── Charts Row 1: Applications Per Internship (Custom Bar Chart) & Status Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Custom CSS Bar Chart: Applications per Internship Listing (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Applications Per Internship Listing
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Candidate volume and decision breakdown for your posted internships
                  </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                    <span className="text-gray-700">Total</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                    <span className="text-gray-700">Accepted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
                    <span className="text-gray-700">Pending</span>
                  </div>
                </div>
              </div>

              {/* Custom CSS Horizontal Bar Chart per Internship */}
              <div>
                {stats.perInternshipStats.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-sm">
                    <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    No internships posted yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.perInternshipStats.map((item) => {
                      const barPercent = Math.max(
                        Math.round((item.total / stats.maxApplicantsInAnyListing) * 100),
                        item.total > 0 ? 8 : 2
                      )
                      const acceptedPercent = item.total > 0 ? Math.round((item.accepted / item.total) * 100) : 0
                      const pendingPercent = item.total > 0 ? Math.round((item.pending / item.total) * 100) : 0
                      const rejectedPercent = item.total > 0 ? Math.round((item.rejected / item.total) * 100) : 0

                      return (
                        <div key={item.id} className="space-y-1.5 group">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 max-w-[280px] sm:max-w-md truncate">
                              <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition truncate">
                                {item.title}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                                  item.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : item.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-gray-600 font-medium">
                              <span className="text-gray-900 font-bold">{item.total} total</span>
                              <span className="text-emerald-600 font-semibold">{item.accepted} accepted ({item.conversion}%)</span>
                            </div>
                          </div>

                          {/* Multi-segmented Bar */}
                          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex shadow-inner">
                            {item.total > 0 ? (
                              <>
                                <div
                                  style={{ width: `${acceptedPercent}%` }}
                                  className="bg-emerald-500 h-full transition-all duration-500"
                                  title={`${item.accepted} Accepted (${acceptedPercent}%)`}
                                />
                                <div
                                  style={{ width: `${pendingPercent}%` }}
                                  className="bg-amber-400 h-full transition-all duration-500"
                                  title={`${item.pending} Pending (${pendingPercent}%)`}
                                />
                                <div
                                  style={{ width: `${rejectedPercent}%` }}
                                  className="bg-rose-400 h-full transition-all duration-500"
                                  title={`${item.rejected} Rejected (${rejectedPercent}%)`}
                                />
                              </>
                            ) : (
                              <div className="w-0 bg-transparent h-full" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Application Outcome Breakdown Card (1 Col) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Application Status Breakdown
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Distribution of candidate review decisions</p>
                </div>

                {/* Progress Visuals */}
                <div className="mt-6 space-y-5">
                  {/* Accepted */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Accepted / Hired
                      </span>
                      <span className="font-bold text-emerald-700">
                        {stats.acceptedCount} ({stats.acceptanceRate}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${stats.acceptanceRate}%` }}
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Pending */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Under Review / Pending
                      </span>
                      <span className="font-bold text-amber-700">
                        {stats.pendingCount} ({stats.pendingRate}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${stats.pendingRate}%` }}
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Rejected */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        Declined / Closed
                      </span>
                      <span className="font-bold text-rose-700">
                        {stats.rejectedCount} ({stats.rejectionRate}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${stats.rejectionRate}%` }}
                        className="bg-rose-400 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Callout Banner */}
              <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-indigo-100 text-center space-y-1">
                <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Candidate Conversion Rate</p>
                <div className="text-3xl font-black text-blue-600">{stats.acceptanceRate}%</div>
                <p className="text-[11px] text-gray-600">
                  {stats.acceptedCount} of {stats.totalApplications} applicants have been successfully accepted
                </p>
              </div>
            </div>
          </div>

          {/* ── Charts Row 2: Monthly Trends & Top Listings ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Inflow Trends (Custom CSS Vertical Bar Chart) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Monthly Application Trends (Last 6 Months)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Comparison of incoming applicants vs accepted hires</p>
                </div>
              </div>

              {stats.monthlyTrends.every((m) => m.applied === 0) ? (
                <div className="text-center py-16 text-gray-400 text-xs">
                  No monthly application submissions recorded in this period.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-gray-100">
                    {stats.monthlyTrends.map((month, idx) => {
                      const appliedHeight = Math.max(
                        Math.round((month.applied / stats.maxMonthlyApplied) * 100),
                        month.applied > 0 ? 8 : 2
                      )
                      const acceptedHeight = Math.max(
                        Math.round((month.accepted / stats.maxMonthlyApplied) * 100),
                        month.accepted > 0 ? 8 : 2
                      )

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                          <div className="w-full flex items-end justify-center gap-1.5 h-full relative">
                            {/* Applied Bar */}
                            <div
                              style={{ height: `${appliedHeight}%` }}
                              className="w-full max-w-[24px] bg-gradient-to-t from-indigo-600 to-blue-500 rounded-t-md transition-all duration-500 group-hover:opacity-90 flex flex-col justify-between items-center py-1"
                            >
                              {month.applied > 0 && (
                                <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  {month.applied}
                                </span>
                              )}
                            </div>

                            {/* Accepted Bar */}
                            <div
                              style={{ height: `${acceptedHeight}%` }}
                              className="w-full max-w-[24px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 group-hover:opacity-90 flex flex-col justify-between items-center py-1"
                            >
                              {month.accepted > 0 && (
                                <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  {month.accepted}
                                </span>
                              )}
                            </div>

                            {/* Hover Tooltip */}
                            <div className="absolute -top-12 bg-gray-900 text-white text-[11px] rounded-md px-2.5 py-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap shadow-md">
                              <strong>{month.label}</strong>: {month.applied} Applied, {month.accepted} Accepted
                            </div>
                          </div>

                          <span className="text-xs font-semibold text-gray-600 mt-2">{month.label}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" /> Total Inflow
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Accepted
                      </span>
                    </div>
                    <span>Peak: <strong>{stats.maxMonthlyApplied} applications</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions & Recent Pipeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-indigo-600" />
                    Quick Actions & Candidate Queue
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Jump directly to candidate evaluations</p>
                </div>
                <Link
                  to="/applications/manage"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  Manage All <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                <Link
                  to="/applications/manage"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                      {stats.pendingCount}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition">
                        Review Pending Applicants
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {stats.pendingCount} candidate applications awaiting evaluation
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </Link>

                <Link
                  to="/internships/new"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      +
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition">
                        Post New Internship Listing
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Expand your hiring pipeline with new openings
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                </Link>

                <Link
                  to="/internships/my"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-emerald-50/50 hover:border-emerald-200 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      {stats.activeInternships}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-600 transition">
                        View Active Listings
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Manage current postings and approval statuses
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
