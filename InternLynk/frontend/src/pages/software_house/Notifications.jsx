import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'
import {
  formatNotificationMessage,
  formatRelativeTime
} from '../../utils/notifications'
import toast from 'react-hot-toast'
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  CheckCheck,
  Filter,
  Sparkles,
  Inbox,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  UserPlus,
  FileText,
  AlertCircle
} from 'lucide-react'

export default function Notifications() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'unread' | 'read' | 'applications' | 'approvals'
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)

  // Use the notification hook configured for software_house role (internship_approval, new_application)
  const {
    notifications = [],
    unreadCount = 0,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetch
  } = useNotifications()

  // Filter notifications based on tab
  const filteredNotifications = useMemo(() => {
    if (filterTab === 'unread') {
      return notifications.filter((n) => !n.is_read)
    }
    if (filterTab === 'read') {
      return notifications.filter((n) => n.is_read)
    }
    if (filterTab === 'applications') {
      return notifications.filter((n) => n.type === 'new_application')
    }
    if (filterTab === 'approvals') {
      return notifications.filter((n) => n.type === 'internship_approval')
    }
    return notifications
  }, [notifications, filterTab])

  // Mark single notification as read
  const handleMarkAsRead = async (id) => {
    try {
      setActionLoadingId(id)
      await markAsRead(id)
      toast.success('Notification marked as read')
    } catch (err) {
      toast.error('Failed to mark notification as read')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Delete single notification
  const handleDeleteNotification = async (id) => {
    try {
      setActionLoadingId(id)
      await deleteNotification(id)
      toast.success('Notification deleted')
    } catch (err) {
      toast.error('Failed to delete notification')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      toast('No unread notifications')
      return
    }
    try {
      setIsBulkActionLoading(true)
      await markAllAsRead()
      toast.success('All notifications marked as read')
    } catch (err) {
      toast.error('Failed to mark all as read')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  // Delete all notifications
  const handleClearAll = async () => {
    if (notifications.length === 0) return
    if (!window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      return
    }
    try {
      setIsBulkActionLoading(true)
      await deleteAllNotifications()
      toast.success('All notifications deleted')
    } catch (err) {
      toast.error('Failed to delete notifications')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  // Render notification icon based on type and status
  const renderNotificationIcon = (notification) => {
    if (notification.type === 'new_application') {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
          <UserPlus className="w-5 h-5" />
        </div>
      )
    }

    if (notification.type === 'internship_approval') {
      const status = notification.metadata?.status
      if (status === 'approved') {
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        )
      }
      if (status === 'rejected') {
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        )
      }
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-5 h-5" />
        </div>
      )
    }

    return (
      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
        <Bell className="w-5 h-5" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                <Bell className="w-3.5 h-3.5 mr-1" />
                Notification Center
              </span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 animate-pulse">
                  {unreadCount} New
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Software House Updates</h1>
            <p className="mt-1 text-blue-100 text-sm max-w-xl">
              Stay informed on new candidate applications, admin approval status for your internship listings, and system alerts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleMarkAllRead}
              disabled={isBulkActionLoading || unreadCount === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-lg border border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
            <button
              onClick={handleClearAll}
              disabled={isBulkActionLoading || notifications.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-rose-500/30 backdrop-blur-sm text-white text-xs font-semibold rounded-lg border border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Delete All Notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters & Notification List ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3 bg-gray-50/50 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterTab === 'unread'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilterTab('applications')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterTab === 'applications'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              New Applicants ({notifications.filter((n) => n.type === 'new_application').length})
            </button>
            <button
              onClick={() => setFilterTab('approvals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterTab === 'approvals'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Admin Approvals ({notifications.filter((n) => n.type === 'internship_approval').length})
            </button>
          </div>

          <span className="text-xs text-gray-400 hidden md:inline">
            Realtime sync active
          </span>
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 md:p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {filterTab === 'unread'
                ? 'No unread notifications'
                : filterTab === 'applications'
                ? 'No new application notifications'
                : filterTab === 'approvals'
                ? 'No internship approval updates'
                : 'No notifications yet'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              {filterTab === 'all'
                ? "You'll receive instant alerts when candidates apply to your postings or when administrators approve your internship listings."
                : 'Check other tabs to review past system activity.'}
            </p>
            {filterTab !== 'all' && (
              <button
                onClick={() => setFilterTab('all')}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((n) => {
              const isApplication = n.type === 'new_application'
              const isApproval = n.type === 'internship_approval'
              const isApproved = isApproval && n.metadata?.status === 'approved'
              const isRejected = isApproval && n.metadata?.status === 'rejected'
              const message = formatNotificationMessage(n)
              const timeAgo = formatRelativeTime(n.created_at)

              return (
                <div
                  key={n.id}
                  className={`p-5 md:p-6 flex items-start gap-4 transition-colors ${
                    n.is_read
                      ? 'bg-white hover:bg-gray-50/70'
                      : 'bg-blue-50/40 hover:bg-blue-50/70'
                  }`}
                >
                  {/* Status / Category Icon */}
                  {renderNotificationIcon(n)}

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-gray-900 leading-snug">
                            {n.title || (
                              isApplication
                                ? 'New Candidate Application'
                                : isApproved
                                ? 'Internship Listing Approved! 🎉'
                                : isRejected
                                ? 'Internship Listing Needs Revision'
                                : 'System Notification'
                            )}
                          </h4>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" title="Unread" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {message}
                        </p>
                      </div>

                      <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                        {timeAgo}
                      </span>
                    </div>

                    {/* Metadata tags and quick action buttons */}
                    <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-[11px]">
                        {n.metadata?.internship_title && (
                          <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            {n.metadata.internship_title}
                          </span>
                        )}
                        {isApplication && (
                          <span className="px-2 py-0.5 rounded font-medium bg-blue-100 text-blue-700">
                            Applicant Submission
                          </span>
                        )}
                        {isApproval && (
                          <span
                            className={`px-2 py-0.5 rounded font-medium capitalize ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-700'
                                : isRejected
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {n.metadata?.status || 'Approval'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            disabled={actionLoadingId === n.id}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}

                        {isApplication ? (
                          <Link
                            to="/applications/manage"
                            className="text-xs text-gray-600 hover:text-indigo-600 font-medium px-2 py-1 rounded hover:bg-gray-100 transition flex items-center gap-1"
                          >
                            <span>Review Applicants</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <Link
                            to="/internships/my"
                            className="text-xs text-gray-600 hover:text-indigo-600 font-medium px-2 py-1 rounded hover:bg-gray-100 transition flex items-center gap-1"
                          >
                            <span>View Listings</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}

                        <button
                          onClick={() => handleDeleteNotification(n.id)}
                          disabled={actionLoadingId === n.id}
                          className="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Footer Information Card ── */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-5 border border-indigo-100 text-xs text-gray-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-gray-900">Software House Notification Policy</p>
          <p className="mt-0.5 text-gray-600 leading-relaxed">
            All notifications in your portal are securely filtered by company account. You will receive notifications when new student submissions arrive for your posted roles and when administrative review on your internship listings concludes.
          </p>
        </div>
      </div>
    </div>
  )
}
