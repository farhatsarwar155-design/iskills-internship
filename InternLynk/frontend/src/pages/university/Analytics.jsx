import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
  GraduationCap,
  Calendar,
  Briefcase,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Award,
  Layers,
  FileSpreadsheet
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
  const [timeframe, setTimeframe] = useState('6months') // '30days', '6months', 'year', 'all'

  // 1. Fetch all students registered under this university (from profiles and students table)
  const { data: students = [], isLoading: isLoadingStudents, refetch: refetchStudents } = useQuery({
    queryKey: ['university-analytics-students', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // First get profiles
      const { data: profileList, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, approval_status, created_at')
        .eq('university_id', user.id)
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      if (profileErr) throw profileErr
      const profiles = profileList ?? []

      // Also get extra metadata from students table if exists
      const { data: studentRecords } = await supabase
        .from('students')
        .select('user_id, degree_program, batch, semester, student_id')
        .eq('university_id', user.id)

      const recordMap = new Map((studentRecords || []).map((r) => [r.user_id, r]))

      return profiles.map((p) => ({
        ...p,
        extra: recordMap.get(p.id) || {},
        degree_program: recordMap.get(p.id)?.degree_program || 'General Science / IT',
        batch: recordMap.get(p.id)?.batch || '2024',
      }))
    },
  })

  // 2. Fetch all applications for those students
  const studentIds = useMemo(() => students.map((s) => s.id), [students])

  const { data: applications = [], isLoading: isLoadingApplications, refetch: refetchApplications } = useQuery({
    queryKey: ['university-analytics-applications', studentIds],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          user_id,
          profiles!applications_user_id_fkey (full_name, email),
          internships (
            id,
            title,
            location,
            duration,
            stipend,
            created_by,
            profiles!internships_created_by_fkey (organization_name)
          )
        `)
        .in('user_id', studentIds)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })

  // Filter applications by timeframe
  const filteredApplications = useMemo(() => {
    if (timeframe === 'all') return applications
    const now = new Date()
    let cutoffDate = new Date()

    if (timeframe === '30days') {
      cutoffDate.setDate(now.getDate() - 30)
    } else if (timeframe === '6months') {
      cutoffDate.setMonth(now.getMonth() - 6)
    } else if (timeframe === 'year') {
      cutoffDate.setFullYear(now.getFullYear() - 1)
    }

    return applications.filter((a) => new Date(a.created_at) >= cutoffDate)
  }, [applications, timeframe])

  // Analytics Computation
  const stats = useMemo(() => {
    const totalStudents = students.length
    const activeStudents = students.filter((s) => s.is_active).length
    const totalApplications = filteredApplications.length

    // Application statuses
    const acceptedApps = filteredApplications.filter((a) => a.status === 'accepted')
    const pendingApps = filteredApplications.filter((a) => a.status === 'pending')
    const rejectedApps = filteredApplications.filter((a) => a.status === 'rejected')

    const acceptedCount = acceptedApps.length
    const pendingCount = pendingApps.length
    const rejectedCount = rejectedApps.length

    // Unique students with applications & placed students
    const uniqueAppliedStudentIds = new Set(filteredApplications.map((a) => a.user_id))
    const uniquePlacedStudentIds = new Set(acceptedApps.map((a) => a.user_id))

    const studentsAppliedCount = uniqueAppliedStudentIds.size
    const studentsPlacedCount = uniquePlacedStudentIds.size

    const placementRate = studentsAppliedCount > 0 ? Math.round((studentsPlacedCount / studentsAppliedCount) * 100) : 0
    const acceptanceRate = totalApplications > 0 ? Math.round((acceptedCount / totalApplications) * 100) : 0
    const pendingRate = totalApplications > 0 ? Math.round((pendingCount / totalApplications) * 100) : 0
    const rejectionRate = totalApplications > 0 ? Math.round((rejectedCount / totalApplications) * 100) : 0

    // Monthly Data Breakdown (Last 6 Months)
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

    // Department / Degree Program Breakdown
    const programStats = {}
    students.forEach((student) => {
      const prog = student.degree_program || 'General IT'
      if (!programStats[prog]) {
        programStats[prog] = { totalStudents: 0, appliedCount: 0, acceptedCount: 0, studentIds: new Set() }
      }
      programStats[prog].totalStudents += 1
      programStats[prog].studentIds.add(student.id)
    })

    applications.forEach((app) => {
      const student = students.find((s) => s.id === app.user_id)
      const prog = student?.degree_program || 'General IT'
      if (programStats[prog]) {
        programStats[prog].appliedCount += 1
        if (app.status === 'accepted') {
          programStats[prog].acceptedCount += 1
        }
      }
    })

    const programList = Object.entries(programStats).map(([program, data]) => {
      const progPlacementRate = data.appliedCount > 0 ? Math.round((data.acceptedCount / data.appliedCount) * 100) : 0
      return {
        program,
        ...data,
        placementRate: progPlacementRate,
      }
    }).sort((a, b) => b.appliedCount - a.appliedCount)

    const maxProgramApplied = Math.max(...programList.map((p) => p.appliedCount), 1)

    // Top Partner Companies (Software Houses)
    const companyCounts = {}
    filteredApplications.forEach((app) => {
      const company = app.internships?.profiles?.organization_name || 'Software House Partner'
      if (!companyCounts[company]) {
        companyCounts[company] = { total: 0, accepted: 0 }
      }
      companyCounts[company].total += 1
      if (app.status === 'accepted') {
        companyCounts[company].accepted += 1
      }
    })

    const topCompanies = Object.entries(companyCounts)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Recent Placed Students
    const recentPlacements = acceptedApps.slice(0, 5)

    return {
      totalStudents,
      activeStudents,
      totalApplications,
      acceptedCount,
      pendingCount,
      rejectedCount,
      studentsAppliedCount,
      studentsPlacedCount,
      placementRate,
      acceptanceRate,
      pendingRate,
      rejectionRate,
      monthlyTrends,
      maxMonthlyApplied,
      programList,
      maxProgramApplied,
      topCompanies,
      recentPlacements,
    }
  }, [students, applications, filteredApplications])

  const isLoading = isLoadingStudents || isLoadingApplications

  const handleRefresh = () => {
    refetchStudents()
    refetchApplications()
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              University Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Placement & Application Analytics</h1>
          <p className="text-gray-600 text-sm mt-1">
            Track student application activity, placement success rates, and departmental progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 text-xs shadow-sm">
            {[
              { id: '30days', label: '30 Days' },
              { id: '6months', label: '6 Months' },
              { id: 'year', label: '1 Year' },
              { id: 'all', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  timeframe === t.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white bg-white/60 border border-indigo-200/60 rounded-lg transition-colors shadow-sm cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading Spinner */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-500">Calculating university metrics and trends...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Enrolled Students"
              value={stats.totalStudents}
              subtext={`${stats.activeStudents} active profiles`}
              colorBg="bg-blue-50"
              colorText="text-blue-600"
              badgeText="Total"
              badgeColor="bg-blue-100 text-blue-700"
              icon={<Users className="w-6 h-6" />}
            />
            <StatCard
              title="Total Applications"
              value={stats.totalApplications}
              subtext={`${stats.studentsAppliedCount} participating students`}
              colorBg="bg-indigo-50"
              colorText="text-indigo-600"
              badgeText={`${stats.studentsAppliedCount} Applied`}
              badgeColor="bg-indigo-100 text-indigo-700"
              icon={<Briefcase className="w-6 h-6" />}
            />
            <StatCard
              title="Students Placed"
              value={stats.acceptedCount}
              subtext={`${stats.placementRate}% student placement rate`}
              colorBg="bg-emerald-50"
              colorText="text-emerald-600"
              badgeText={`${stats.placementRate}% Success`}
              badgeColor="bg-emerald-100 text-emerald-700"
              icon={<Award className="w-6 h-6" />}
            />
            <StatCard
              title="Under Review"
              value={stats.pendingCount}
              subtext={`${stats.rejectedCount} applications declined`}
              colorBg="bg-amber-50"
              colorText="text-amber-600"
              badgeText={`${stats.pendingRate}% Pending`}
              badgeColor="bg-amber-100 text-amber-700"
              icon={<Clock className="w-6 h-6" />}
            />
          </div>

          {/* Charts Section: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Bar Chart: Students Applied vs Accepted Trends (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Students Applied vs Accepted (Monthly)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Comparison of total submitted applications against successful offers per month
                  </p>
                </div>

                {/* Chart Legend */}
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                    <span className="text-gray-700">Applied</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                    <span className="text-gray-700">Accepted / Placed</span>
                  </div>
                </div>
              </div>

              {/* Custom CSS Bar Chart */}
              <div className="pt-4">
                {stats.monthlyTrends.every((m) => m.applied === 0) ? (
                  <div className="text-center py-16 text-gray-400 text-sm">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    No application data recorded for this time range.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Chart Bars Grid */}
                    <div className="h-64 flex items-end justify-between gap-2 sm:gap-6 pt-6 pb-2 px-2 border-b border-gray-100">
                      {stats.monthlyTrends.map((month, idx) => {
                        const appliedHeightPercent = Math.max(
                          Math.round((month.applied / stats.maxMonthlyApplied) * 100),
                          month.applied > 0 ? 8 : 2
                        )
                        const acceptedHeightPercent = Math.max(
                          Math.round((month.accepted / stats.maxMonthlyApplied) * 100),
                          month.accepted > 0 ? 8 : 2
                        )

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                            {/* Bar Pair */}
                            <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full relative">
                              {/* Applied Bar */}
                              <div
                                style={{ height: `${appliedHeightPercent}%` }}
                                className="w-full max-w-[28px] bg-gradient-to-t from-indigo-600 to-blue-500 rounded-t-md transition-all duration-500 group-hover:opacity-90 relative flex flex-col justify-between items-center py-1"
                              >
                                {month.applied > 0 && (
                                  <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    {month.applied}
                                  </span>
                                )}
                              </div>

                              {/* Accepted Bar */}
                              <div
                                style={{ height: `${acceptedHeightPercent}%` }}
                                className="w-full max-w-[28px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 group-hover:opacity-90 relative flex flex-col justify-between items-center py-1"
                              >
                                {month.accepted > 0 && (
                                  <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    {month.accepted}
                                  </span>
                                )}
                              </div>

                              {/* Hover Tooltip */}
                              <div className="absolute -top-12 bg-gray-900 text-white text-[11px] rounded-md px-2.5 py-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap shadow-md">
                                <strong>{month.label}</strong>: {month.applied} Applied, {month.accepted} Accepted
                              </div>
                            </div>

                            {/* X-axis Label */}
                            <span className="text-xs font-semibold text-gray-600 mt-2">{month.label}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Chart Summary Footnote */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 px-1">
                      <span>Y-axis: Total monthly application count</span>
                      <span>
                        Peak monthly activity: <strong>{stats.maxMonthlyApplied} applications</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Application Outcome Distribution (1 Col) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Application Outcomes
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Status breakdown of submitted applications</p>
                </div>

                {/* Progress Visual Bars */}
                <div className="mt-6 space-y-5">
                  {/* Accepted */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Accepted / Placed
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
                        Rejected / Closed
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

              {/* Placement Rate Callout Box */}
              <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-indigo-100 text-center space-y-1">
                <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Overall Placement Success</p>
                <div className="text-3xl font-black text-blue-600">{stats.placementRate}%</div>
                <p className="text-[11px] text-gray-600">
                  {stats.studentsPlacedCount} of {stats.studentsAppliedCount} applied students secured internships
                </p>
              </div>
            </div>
          </div>

          {/* Department Performance & Top Partner Companies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Degree Program / Department Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    Departmental Performance
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Application vs Placement by Degree Program</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {stats.programList.length} Programs
                </span>
              </div>

              {stats.programList.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No program data recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {stats.programList.map((prog, i) => {
                    const barPercent = Math.max(Math.round((prog.appliedCount / stats.maxProgramApplied) * 100), 5)
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-800 truncate max-w-[200px]">{prog.program}</span>
                          <span className="text-gray-500 font-medium">
                            <strong className="text-gray-900">{prog.appliedCount}</strong> applied •{' '}
                            <strong className="text-emerald-600">{prog.acceptedCount}</strong> placed ({prog.placementRate}%)
                          </span>
                        </div>

                        {/* Dual Progress Bar for Program */}
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${barPercent}%` }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Top Hiring Software Houses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-600" />
                    Top Hiring Partners
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Software houses with highest student interest & hires</p>
                </div>
                <Link
                  to="/university/applications"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  View All <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {stats.topCompanies.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No company application records found.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {stats.topCompanies.map((comp, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {comp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{comp.name}</p>
                          <p className="text-[11px] text-gray-500">{comp.total} total application(s)</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {comp.accepted} Placed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Need detailed student reports?</h3>
                <p className="text-xs text-gray-500">Access individual student records or register new batches via CSV.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/bulk-upload"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
              >
                Bulk Upload Students
              </Link>
              <Link
                to="/university/students"
                className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Manage Students
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
