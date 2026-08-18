import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Calendar,
  Building,
  MapPin,
  ArrowUpRight,
  PieChart,
  Percent,
  Sparkles
} from 'lucide-react'

// ─── Metric Card Component ──────────────────────────────────────────────────
function MetricCard({ title, value, subtext, icon, colorBg, colorText, badgeText, badgeColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorBg} ${colorText}`}>
          {icon}
        </div>
      </div>
      {(subtext || badgeText) && (
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
          <span className="text-gray-500">{subtext}</span>
          {badgeText && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function StudentAnalytics() {
  const { user, profile } = useAuth()

  // Fetch applications with joined internship details
  const { data: applications = [], isLoading, isError } = useQuery({
    queryKey: ['student-analytics-applications', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          cover_letter,
          internship_id,
          internships (
            id,
            title,
            location,
            duration,
            stipend,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: !!user?.id,
  })

  // Aggregate stats
  const stats = useMemo(() => {
    const total = applications.length
    const accepted = applications.filter(a => a.status === 'accepted').length
    const pending = applications.filter(a => a.status === 'pending').length
    const rejected = applications.filter(a => a.status === 'rejected').length

    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0
    const pendingRate = total > 0 ? Math.round((pending / total) * 100) : 0
    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0

    // Monthly breakdown (last 6 calendar months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    const monthlyData = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth()
      const label = `${monthNames[month]}`

      const monthApps = applications.filter(a => {
        const appDate = new Date(a.created_at)
        return appDate.getFullYear() === year && appDate.getMonth() === month
      })

      const mTotal = monthApps.length
      const mAccepted = monthApps.filter(a => a.status === 'accepted').length
      const mPending = monthApps.filter(a => a.status === 'pending').length
      const mRejected = monthApps.filter(a => a.status === 'rejected').length

      monthlyData.push({
        label,
        year,
        total: mTotal,
        accepted: mAccepted,
        pending: mPending,
        rejected: mRejected,
      })
    }

    const maxMonthlyCount = Math.max(...monthlyData.map(m => m.total), 1)

    // Location distribution
    const locationCounts = {}
    applications.forEach(a => {
      const loc = a.internships?.location || 'Remote / Unspecified'
      locationCounts[loc] = (locationCounts[loc] || 0) + 1
    })

    return {
      total,
      accepted,
      pending,
      rejected,
      acceptanceRate,
      pendingRate,
      rejectionRate,
      monthlyData,
      maxMonthlyCount,
      locationCounts,
    }
  }, [applications])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading your analytics insights...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-100 max-w-lg mx-auto my-12">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-rose-900">Unable to load analytics</h3>
        <p className="text-sm text-rose-600 mt-1">Please refresh the page or check your connection.</p>
      </div>
    )
  }

  const role = profile?.role || 'student'
  const isGuest = role === 'guest'

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                <BarChart3 className="w-3.5 h-3.5 mr-1" />
                Performance Metrics
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-100 uppercase">
                {isGuest ? 'Guest Portal' : 'Student Portal'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Application Analytics</h1>
            <p className="mt-1 text-blue-100 text-sm max-w-xl">
              Gain visual insights into your internship submissions, response times, and success rates.
            </p>
          </div>

          <Link
            to="/listings"
            className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-lg text-sm shadow-sm hover:bg-blue-50 transition-colors"
          >
            <span>Explore Opportunities</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Applications"
          value={stats.total}
          subtext="All submissions to date"
          icon={<FileText className="w-6 h-6" />}
          colorBg="bg-blue-50"
          colorText="text-blue-600"
          badgeText={`${stats.total} total`}
          badgeColor="bg-blue-100 text-blue-700"
        />
        <MetricCard
          title="Accepted"
          value={stats.accepted}
          subtext={`${stats.acceptanceRate}% success rate`}
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorBg="bg-emerald-50"
          colorText="text-emerald-600"
          badgeText={`${stats.acceptanceRate}%`}
          badgeColor="bg-emerald-100 text-emerald-700"
        />
        <MetricCard
          title="Under Review"
          value={stats.pending}
          subtext={`${stats.pendingRate}% awaiting response`}
          icon={<Clock className="w-6 h-6" />}
          colorBg="bg-amber-50"
          colorText="text-amber-600"
          badgeText={`${stats.pendingRate}%`}
          badgeColor="bg-amber-100 text-amber-700"
        />
        <MetricCard
          title="Not Selected"
          value={stats.rejected}
          subtext={`${stats.rejectionRate}% rejection rate`}
          icon={<XCircle className="w-6 h-6" />}
          colorBg="bg-rose-50"
          colorText="text-rose-600"
          badgeText={`${stats.rejectionRate}%`}
          badgeColor="bg-rose-100 text-rose-700"
        />
      </div>

      {/* ── Main Visual Graphs Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Status Distribution Visual Bars (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                Status Distribution Breakdown
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Visual representation of your current application states</p>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {stats.total} {stats.total === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          {stats.total === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">No application data available yet.</p>
              <p className="text-xs text-gray-400 mt-1">Apply for internships to view status charts.</p>
              <Link
                to="/listings"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
              >
                Browse Listings
              </Link>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {/* Accepted Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    Accepted Applications
                  </span>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-gray-900">{stats.accepted}</span>
                    <span className="text-gray-400">({stats.acceptanceRate}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${stats.acceptanceRate}%` }}
                  />
                </div>
              </div>

              {/* Pending Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    Pending / In Review
                  </span>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-gray-900">{stats.pending}</span>
                    <span className="text-gray-400">({stats.pendingRate}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${stats.pendingRate}%` }}
                  />
                </div>
              </div>

              {/* Rejected Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    Rejected / Not Selected
                  </span>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-gray-900">{stats.rejected}</span>
                    <span className="text-gray-400">({stats.rejectionRate}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-rose-600 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${stats.rejectionRate}%` }}
                  />
                </div>
              </div>

              {/* Segmented Cumulative Bar */}
              <div className="pt-4 mt-6 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500 mb-2 font-medium">
                  <span>Overall Proportion View</span>
                  <span>100% of Total Submissions</span>
                </div>
                <div className="w-full h-5 rounded-lg overflow-hidden flex bg-gray-100 shadow-inner">
                  {stats.accepted > 0 && (
                    <div
                      style={{ width: `${stats.acceptanceRate}%` }}
                      className="bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center text-[10px] font-bold text-white"
                      title={`Accepted: ${stats.accepted}`}
                    >
                      {stats.acceptanceRate >= 10 && `${stats.acceptanceRate}%`}
                    </div>
                  )}
                  {stats.pending > 0 && (
                    <div
                      style={{ width: `${stats.pendingRate}%` }}
                      className="bg-amber-400 hover:bg-amber-500 transition-colors flex items-center justify-center text-[10px] font-bold text-white"
                      title={`Pending: ${stats.pending}`}
                    >
                      {stats.pendingRate >= 10 && `${stats.pendingRate}%`}
                    </div>
                  )}
                  {stats.rejected > 0 && (
                    <div
                      style={{ width: `${stats.rejectionRate}%` }}
                      className="bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center text-[10px] font-bold text-white"
                      title={`Rejected: ${stats.rejected}`}
                    >
                      {stats.rejectionRate >= 10 && `${stats.rejectionRate}%`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Success Rate Gauge Card (1 Column) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900 text-base">Conversion Rate</h3>
            </div>

            <div className="py-8 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Custom circular progress border */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-600 transition-all duration-1000 ease-out"
                    strokeDasharray={`${stats.acceptanceRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-gray-900">{stats.acceptanceRate}%</span>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Accepted</span>
                </div>
              </div>

              <div className="mt-6 text-center space-y-1">
                <p className="text-sm font-semibold text-gray-800">
                  {stats.acceptanceRate >= 50
                    ? '🎉 Outstanding Success!'
                    : stats.acceptanceRate > 0
                    ? '👍 Positive Momentum'
                    : '🚀 Keep Applying!'}
                </p>
                <p className="text-xs text-gray-500 max-w-[220px]">
                  {stats.accepted} of {stats.total} total application{stats.total === 1 ? '' : 's'} accepted by employers.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-100/70 text-xs text-indigo-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Pro Tip:
            </p>
            <p className="text-indigo-700/90 leading-relaxed">
              Applying to 3+ internships in your target domain increases your acceptance probability by 65%.
            </p>
          </div>
        </div>
      </div>

      {/* ── Monthly Submissions Activity Chart (Custom CSS Vertical Bars) ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Application Activity Timeline (Last 6 Months)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Frequency of internship submissions per month</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
              Applications Count
            </span>
          </div>
        </div>

        <div className="pt-6 pb-2">
          <div className="h-64 flex items-end justify-between gap-3 sm:gap-6 border-b border-gray-200 px-2 sm:px-6">
            {stats.monthlyData.map((item, idx) => {
              const heightPercent = stats.maxMonthlyCount > 0 ? (item.total / stats.maxMonthlyCount) * 100 : 0
              const clampedHeight = Math.max(heightPercent, 4) // minimum height for visibility

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[11px] rounded px-2 py-1 mb-2 pointer-events-none shadow-lg whitespace-nowrap z-10 font-medium">
                    {item.total} applications ({item.accepted} accepted)
                  </div>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[48px] bg-gray-100 rounded-t-lg h-full flex items-end p-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-md transition-all duration-700 ease-out group-hover:from-blue-700 group-hover:to-indigo-600 shadow-sm relative flex items-start justify-center pt-1"
                      style={{ height: `${item.total === 0 ? 6 : clampedHeight}%` }}
                    >
                      {item.total > 0 && (
                        <span className="text-[10px] font-bold text-white drop-shadow-sm">
                          {item.total}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Month Label */}
                  <div className="mt-3 text-center">
                    <span className="text-xs font-semibold text-gray-700 block">{item.label}</span>
                    <span className="text-[10px] text-gray-400">{item.year}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Recent Applications Detail Breakdown ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Application Details Log</h2>
            <p className="text-xs text-gray-500">History of your applications and their current statuses</p>
          </div>
          <Link
            to="/applications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            Manage Applications &rarr;
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No application records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-4 font-semibold">Position & Details</th>
                  <th className="pb-3 pr-4 font-semibold">Location</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.slice(0, 8).map((app) => {
                  const statusColors = {
                    accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    pending: 'bg-amber-100 text-amber-800 border-amber-200',
                    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
                  }

                  return (
                    <tr key={app.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 pr-4 font-medium text-gray-900">
                        <div>
                          <span>{app.internships?.title || 'Internship Position'}</span>
                          {app.internships?.duration && (
                            <span className="block text-xs text-gray-400 font-normal">
                              Duration: {app.internships.duration}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {app.internships?.location || 'Remote'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                            statusColors[app.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-xs text-gray-500">
                        {new Date(app.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
