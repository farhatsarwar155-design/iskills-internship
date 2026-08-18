import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../utils/supabase'
import toast from 'react-hot-toast'
import {
  FileSpreadsheet,
  Search,
  Filter,
  Clock,
  User,
  Shield,
  Briefcase,
  Layers,
  RefreshCw,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar
} from 'lucide-react'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [targetFilter, setTargetFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  // Fetch admin and activity logs
  const fetchLogs = async () => {
    try {
      setLoading(true)

      // 1. Fetch admin_logs
      let adminLogs = []
      try {
        const { data, error } = await supabase
          .from('admin_logs')
          .select('id, admin_id, action, target_type, target_id, feedback, metadata, timestamp')
          .order('timestamp', { ascending: false })
          .limit(500)
        if (!error && data) adminLogs = data
      } catch (e) {
        console.warn('admin_logs fetch warning:', e)
      }

      // 2. Fetch activity_logs
      let actLogs = []
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('id, actor_id, role, action, target_type, target_id, metadata, timestamp')
          .order('timestamp', { ascending: false })
          .limit(200)
        if (!error && data) actLogs = data
      } catch (e) {
        console.warn('activity_logs fetch warning:', e)
      }

      const formattedAct = actLogs.map((a) => ({
        ...a,
        admin_id: a.actor_id,
        feedback: null,
      }))

      const logMap = new Map()
      adminLogs.forEach((l) => logMap.set(l.id, l))
      formattedAct.forEach((l) => {
        if (!logMap.has(l.id)) logMap.set(l.id, l)
      })
      let combinedLogs = Array.from(logMap.values())

      // 3. Enrich with profile information
      const userIds = [...new Set(combinedLogs.map((l) => l.admin_id || l.actor_id).filter(Boolean))]
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .in('id', userIds)
        const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
        combinedLogs = combinedLogs.map((l) => ({
          ...l,
          profiles: profileMap[l.admin_id || l.actor_id] || { email: 'admin@internlynk.com', full_name: 'Administrator', role: 'admin' },
        }))
      }

      combinedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setLogs(combinedLogs)
    } catch (err) {
      console.error('Error fetching audit logs:', err)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // Unique actions for filter dropdown
  const uniqueActions = useMemo(() => {
    const actions = logs.map((l) => l.action).filter(Boolean)
    return Array.from(new Set(actions))
  }, [logs])

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false
      }

      // Target filter
      if (targetFilter !== 'all' && log.target_type !== targetFilter) {
        return false
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const actor = (log.profiles?.email || log.profiles?.full_name || log.admin_id || '').toLowerCase()
        const action = (log.action || '').toLowerCase()
        const target = (log.target_type || '').toLowerCase()
        const targetId = (log.target_id || '').toLowerCase()
        const feedback = (log.feedback || '').toLowerCase()
        const meta = JSON.stringify(log.metadata || {}).toLowerCase()

        return (
          actor.includes(q) ||
          action.includes(q) ||
          target.includes(q) ||
          targetId.includes(q) ||
          feedback.includes(q) ||
          meta.includes(q)
        )
      }

      return true
    })
  }, [logs, actionFilter, targetFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredLogs.slice(start, start + pageSize)
  }, [filteredLogs, page, pageSize])

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export')
      return
    }

    const headers = ['Timestamp', 'Actor Email', 'Action', 'Target Type', 'Target ID', 'Feedback / Details']
    const rows = filteredLogs.map((log) => [
      log.timestamp ? new Date(log.timestamp).toISOString() : '',
      `"${log.profiles?.email || log.admin_id || 'System'}"`,
      `"${log.action || ''}"`,
      `"${log.target_type || ''}"`,
      `"${log.target_id || ''}"`,
      `"${(log.feedback || JSON.stringify(log.metadata || {})).replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Audit logs exported to CSV!')
  }

  const getActionBadge = (action) => {
    if (!action) return <span className="text-gray-500">N/A</span>

    if (action.includes('approve')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {action}
        </span>
      )
    }
    if (action.includes('reject') || action.includes('deactivate') || action.includes('delete')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {action}
        </span>
      )
    }
    if (action.includes('login') || action.includes('logout')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {action}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        {action}
      </span>
    )
  }

  const getTargetBadge = (targetType) => {
    const map = {
      profile: 'bg-blue-100 text-blue-800',
      internship: 'bg-indigo-100 text-indigo-800',
      system: 'bg-gray-100 text-gray-800',
      application: 'bg-emerald-100 text-emerald-800',
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[targetType] || 'bg-gray-100 text-gray-700'}`}>
        {targetType || 'system'}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">System Audit Logs</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Immutable tracking of administrator actions, approvals, role updates, and system events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by admin email, action name, target ID, metadata..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by action"
              className="px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer"
            >
              <option value="all">All Actions ({logs.length})</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by target type"
              className="px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer"
            >
              <option value="all">All Target Types</option>
              <option value="profile">Profile</option>
              <option value="internship">Internship</option>
              <option value="system">System</option>
              <option value="application">Application</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500">Loading audit records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-700">No audit logs found</p>
            <p className="text-sm text-gray-400 mt-1">Try resetting search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Actor / Admin</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Target</th>
                  <th className="py-3.5 px-6">Details / Feedback</th>
                  <th className="py-3.5 px-6 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {paginatedLogs.map((log) => {
                  const actorEmail = log.profiles?.email || log.profiles?.full_name || log.admin_id || 'System'
                  const displayDetails = log.feedback || (log.metadata ? JSON.stringify(log.metadata) : '—')

                  return (
                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-6 whitespace-nowrap text-xs text-gray-500 font-mono">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                            {actorEmail[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 truncate max-w-xs">{actorEmail}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">{getActionBadge(log.action)}</td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          {getTargetBadge(log.target_type)}
                          {log.target_id && (
                            <span className="text-xs font-mono text-gray-400 truncate max-w-[80px]">
                              {log.target_id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <p className="text-xs text-gray-600 truncate max-w-sm" title={displayDetails}>
                          {displayDetails}
                        </p>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Inspect raw log"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredLogs.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredLogs.length)} of {filteredLogs.length} events</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                aria-label="Events per page"
                className="ml-2 border border-gray-200 rounded px-2 py-1 bg-white"
              >
                <option value={15}>15 / page</option>
                <option value={30}>30 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-medium text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Audit Log Record</h3>
                <p className="text-xs text-gray-400 font-mono">ID: {selectedLog.id}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-700 border-t border-gray-100 pt-4">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Timestamp:</span>
                <span className="font-mono text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Actor:</span>
                <span className="font-semibold text-gray-900">
                  {selectedLog.profiles?.email || selectedLog.admin_id || 'System'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Action:</span>
                <span>{getActionBadge(selectedLog.action)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Target Type:</span>
                <span>{getTargetBadge(selectedLog.target_type)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Target ID:</span>
                <span className="font-mono text-gray-900">{selectedLog.target_id || 'N/A'}</span>
              </div>
              {selectedLog.feedback && (
                <div className="py-2 border-b border-gray-50">
                  <span className="text-gray-500 font-medium block mb-1">Feedback / Comment:</span>
                  <p className="bg-gray-50 p-2.5 rounded-lg text-gray-800">{selectedLog.feedback}</p>
                </div>
              )}
              {selectedLog.metadata && (
                <div className="py-2">
                  <span className="text-gray-500 font-medium block mb-1">Raw Metadata JSON:</span>
                  <pre className="bg-gray-900 text-emerald-400 p-3 rounded-lg overflow-x-auto text-[11px] font-mono">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
