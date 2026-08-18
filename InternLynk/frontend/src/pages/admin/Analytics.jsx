import React, { useState, useEffect } from 'react'
import {
  fetchUserAnalytics,
  fetchInternshipAnalytics,
  fetchApplicationAnalytics,
  fetchPerformanceMetrics,
  fetchRoleSpecificInsights,
} from '../../utils/adminAnalytics'
import toast from 'react-hot-toast'
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  FileCheck,
  Activity,
  Calendar,
  RefreshCw,
  Building,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Award
} from 'lucide-react'

export default function Analytics() {
  const [dateFilter, setDateFilter] = useState('6months')
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [internshipData, setInternshipData] = useState(null)
  const [applicationData, setApplicationData] = useState(null)
  const [performanceData, setPerformanceData] = useState(null)
  const [roleInsights, setRoleInsights] = useState(null)

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [uData, iData, aData, pData, rData] = await Promise.all([
        fetchUserAnalytics(dateFilter),
        fetchInternshipAnalytics(dateFilter),
        fetchApplicationAnalytics(dateFilter),
        fetchPerformanceMetrics(dateFilter),
        fetchRoleSpecificInsights(dateFilter),
      ])
      setUserData(uData)
      setInternshipData(iData)
      setApplicationData(aData)
      setPerformanceData(pData)
      setRoleInsights(rData)
    } catch (err) {
      console.error('Error loading admin analytics:', err)
      toast.error('Failed to load platform analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [dateFilter])

  const dateFilterTabs = [
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: '6months', label: 'Last 6 Months' },
    { id: '1year', label: 'Last Year' },
    { id: 'all', label: 'All Time' },
  ]

  // Role Color map
  const roleColors = {
    student: 'bg-emerald-500',
    software_house: 'bg-indigo-500',
    university: 'bg-blue-500',
    guest: 'bg-amber-500',
    admin: 'bg-purple-500',
  }

  const roleTextColors = {
    student: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    software_house: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    university: 'text-blue-700 bg-blue-50 border-blue-200',
    guest: 'text-amber-700 bg-amber-50 border-amber-200',
    admin: 'text-purple-700 bg-purple-50 border-purple-200',
  }

  // Find max count in growthTrend for scaling bar charts
  const maxGrowthCount = Math.max(...(userData?.growthTrend?.map((t) => t.count) || [1]), 1)
  const maxInternshipTrend = Math.max(...(internshipData?.trends?.map((t) => t.count) || [1]), 1)
  const maxAppTrend = Math.max(...(applicationData?.trends?.map((t) => t.count) || [1]), 1)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Platform Analytics</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            High-level metrics, growth rates, conversion health, and user activity insights.
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          {dateFilterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                dateFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top 4 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Users</p>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-3">{userData?.totalUsers ?? '—'}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {userData?.growthPercentage >= 0 ? (
              <span className="text-emerald-600 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{userData?.growthPercentage}%
              </span>
            ) : (
              <span className="text-rose-600 font-semibold flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {userData?.growthPercentage}%
              </span>
            )}
            <span className="text-gray-400">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Internships</p>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-3">{internshipData?.totalInternships ?? '—'}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="text-indigo-600 font-semibold">{internshipData?.approvalRate ?? 0}%</span>
            <span className="text-gray-400">approved rate</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Applications</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-3">{applicationData?.totalApplications ?? '—'}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="text-emerald-600 font-semibold">{applicationData?.acceptanceRate ?? 0}%</span>
            <span className="text-gray-400">acceptance rate</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Platform Health</p>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-3">{performanceData?.healthScore ?? 100}/100</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="text-emerald-600 font-semibold">{performanceData?.engagementRate ?? 0}%</span>
            <span className="text-gray-400">active engagement</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 flex flex-col items-center justify-center">
          <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Calculating platform statistics...</p>
        </div>
      ) : (
        <>
          {/* Charts Row 1: Growth Trend & Role Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Growth Trend (Custom CSS Bar Chart) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900">User Growth Over Time</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Monthly new user registrations</p>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  Trend ({dateFilter})
                </span>
              </div>

              {userData?.growthTrend && userData.growthTrend.length > 0 ? (
                <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-gray-100">
                  {userData.growthTrend.map((item, idx) => {
                    const heightPercent = Math.max(Math.round((item.count / maxGrowthCount) * 100), 8)
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.count}
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[42px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg group-hover:from-blue-700 group-hover:to-indigo-600 transition-all shadow-sm"
                        />
                        <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                  No growth data for selected range
                </div>
              )}
            </div>

            {/* Role Distribution (Custom Progress Breakdown) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Role Distribution</h3>
                <p className="text-xs text-gray-400 mb-4">Breakdown of registered accounts</p>

                <div className="space-y-3">
                  {userData?.roleDistribution &&
                    Object.entries(userData.roleDistribution).map(([role, count]) => {
                      const percent = userData.totalUsers > 0 ? Math.round((count / userData.totalUsers) * 100) : 0
                      const roleName = role.replace('_', ' ').toUpperCase()

                      return (
                        <div key={role} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-gray-700 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${roleColors[role] || 'bg-gray-400'}`} />
                              {roleName}
                            </span>
                            <span className="text-gray-500 font-bold">
                              {count} ({percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${percent}%` }}
                              className={`h-full rounded-full ${roleColors[role] || 'bg-gray-400'}`}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Active: {userData?.statusDistribution?.active || 0}</span>
                <span>Pending: {userData?.statusDistribution?.pending || 0}</span>
                <span>Rejected: {userData?.statusDistribution?.rejected || 0}</span>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Applications & Internships Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Applications Status Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Application Performance</h3>
                  <p className="text-xs text-gray-400">Total student and guest submissions</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {applicationData?.acceptanceRate}% Accepted
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl">
                  <p className="text-xs text-amber-600 font-medium">Pending</p>
                  <p className="text-xl font-bold text-amber-800 mt-0.5">{applicationData?.statusCounts?.pending || 0}</p>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl">
                  <p className="text-xs text-emerald-600 font-medium">Accepted</p>
                  <p className="text-xl font-bold text-emerald-800 mt-0.5">{applicationData?.statusCounts?.accepted || 0}</p>
                </div>
                <div className="bg-rose-50/60 border border-rose-100 p-3 rounded-xl">
                  <p className="text-xs text-rose-600 font-medium">Rejected</p>
                  <p className="text-xl font-bold text-rose-800 mt-0.5">{applicationData?.statusCounts?.rejected || 0}</p>
                </div>
              </div>

              {/* Monthly Application Trend */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Monthly Submissions</p>
              <div className="h-32 flex items-end justify-between gap-2 pt-2 pb-1 border-b border-gray-100">
                {applicationData?.trends?.map((item, idx) => {
                  const heightPercent = Math.max(Math.round((item.count / maxAppTrend) * 100), 10)
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[28px] bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-md shadow-sm"
                      />
                      <span className="text-[10px] text-gray-400 font-medium">{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Internship Marketplace Analytics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Internship Approvals</h3>
                  <p className="text-xs text-gray-400">Software house posting overview</p>
                </div>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                  Avg Review: {internshipData?.avgApprovalTime ? `${internshipData.avgApprovalTime}h` : '< 24h'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl">
                  <p className="text-xs text-amber-600 font-medium">Pending</p>
                  <p className="text-xl font-bold text-amber-800 mt-0.5">{internshipData?.statusCounts?.pending || 0}</p>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl">
                  <p className="text-xs text-emerald-600 font-medium">Approved</p>
                  <p className="text-xl font-bold text-emerald-800 mt-0.5">{internshipData?.statusCounts?.approved || 0}</p>
                </div>
                <div className="bg-rose-50/60 border border-rose-100 p-3 rounded-xl">
                  <p className="text-xs text-rose-600 font-medium">Rejected</p>
                  <p className="text-xl font-bold text-rose-800 mt-0.5">{internshipData?.statusCounts?.rejected || 0}</p>
                </div>
              </div>

              {/* Top Software Houses list */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Software Houses</p>
              <div className="space-y-2">
                {internshipData?.topSoftwareHouses && internshipData.topSoftwareHouses.length > 0 ? (
                  internshipData.topSoftwareHouses.slice(0, 3).map((sh, i) => (
                    <div key={sh.id || i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs">
                      <span className="font-semibold text-gray-800 truncate">{sh.name}</span>
                      <span className="text-indigo-600 font-bold">{sh.count} listings</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-3 text-center">No software house data yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Role Specific Insights Cards */}
          {roleInsights && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-gray-800 text-sm">Students</h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Registered:</span>
                    <span className="font-bold text-gray-900">{roleInsights.student?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Applications:</span>
                    <span className="font-bold text-gray-900">{roleInsights.student?.applicationsSubmitted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Accepted:</span>
                    <span className="font-bold text-emerald-600">{roleInsights.student?.applicationsAccepted || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-gray-800 text-sm">Software Houses</h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Registered:</span>
                    <span className="font-bold text-gray-900">{roleInsights.softwareHouse?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Posted:</span>
                    <span className="font-bold text-gray-900">{roleInsights.softwareHouse?.internshipsPosted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Approved:</span>
                    <span className="font-bold text-indigo-600">{roleInsights.softwareHouse?.internshipsApproved || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-gray-800 text-sm">Universities</h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Partners:</span>
                    <span className="font-bold text-gray-900">{roleInsights.university?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Enrolled Students:</span>
                    <span className="font-bold text-gray-900">{roleInsights.university?.studentsRegistered || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Apply Rate:</span>
                    <span className="font-bold text-blue-600">{roleInsights.university?.studentApplicationRate || 0}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-gray-800 text-sm">Guests</h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Registered:</span>
                    <span className="font-bold text-gray-900">{roleInsights.guest?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Applications:</span>
                    <span className="font-bold text-gray-900">{roleInsights.guest?.applicationsSubmitted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Converted:</span>
                    <span className="font-bold text-amber-600">{roleInsights.guest?.conversionToStudent || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
