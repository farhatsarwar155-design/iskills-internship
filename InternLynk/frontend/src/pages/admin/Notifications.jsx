import React, { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'
import {
  formatNotificationMessage,
  formatRelativeTime,
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
  UserCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function AdminNotifications() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all') // 'all' | 'unread' | 'read' | 'user_approval' | 'internship_approval'
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)

  // Use the notification hook configured for admin role
  const {
    notifications = [],
    unreadCount = 0,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetch,
  } = useNotifications()

  // Filter notifications based on tab
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread') return !n.is_read
      if (filter === 'read') return n.is_read
      if (filter === 'user_approval') return n.type === 'user_approval'
      if (filter === 'internship_approval') return n.type === 'internship_approval'
      return true
    })
  }, [notifications, filter])

  // Mark single as read
  const handleMarkAsRead = async (id) => {
    try {
      setActionLoadingId(id)
      await markAsRead(id)
      toast.success('Marked as read')
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
      toast.success('Notification removed')
    } catch (err) {
      toast.error('Failed to delete notification')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Mark all as read
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

  // Clear all notifications
  const handleClearAll = async () => {
    if (notifications.length === 0) return
    if (!window.confirm('Are you sure you want to delete all notifications?')) {
      return
    }
    try {
      setIsBulkActionLoading(true)
      await deleteAllNotifications()
      toast.success('All notifications cleared')
    } catch (err) {
      toast.error('Failed to clear notifications')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  // Handle notification navigation
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id).catch(() => {})
    }

    if (notification.type === 'user_approval') {
      navigate('/admin/pending-accounts')
    } else if (notification.type === 'internship_approval') {
      navigate('/admin/pending-internships')
    }
  }

  const getNotificationIcon = (type) => {
    if (type === 'user_approval') {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-amber-100">
          <UserCheck className="w-5 h-5" />
        </div>
      )
    }
    if (type === 'internship_approval') {
      return (
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-100">
          <Briefcase className="w-5 h-5" />
        </div>
      )
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100">
        <Bell className="w-5 h-5" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Admin Notifications</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Review pending review alerts, registration requests, and platform events.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isBulkActionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
            >
              <CheckCheck className="w-4 h-4 text-blue-600" />
              Mark all as read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isBulkActionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-sm"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All Notifications', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'read', label: 'Read', count: notifications.length - unreadCount },
          { id: 'user_approval', label: 'Account Approvals', count: notifications.filter((n) => n.type === 'user_approval').length },
          { id: 'internship_approval', label: 'Internship Listings', count: notifications.filter((n) => n.type === 'internship_approval').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  filter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 flex flex-col items-center justify-center">
          <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <Inbox className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800">No notifications here</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            {filter === 'unread'
              ? "You've read all your notifications!"
              : 'You have no notifications matching the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const isProcessing = actionLoadingId === notification.id
            const message = formatNotificationMessage(notification)
            const timeAgo = formatRelativeTime(notification.created_at)

            return (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  !notification.is_read
                    ? 'bg-blue-50/40 border-blue-200/80 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div
                  onClick={() => handleNotificationClick(notification)}
                  className="flex items-start gap-3.5 flex-1 cursor-pointer"
                >
                  {getNotificationIcon(notification.type)}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {message}
                      </p>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo}
                      </span>
                      <span>•</span>
                      <span className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                        {notification.type === 'user_approval' ? 'Review Accounts' : 'Review Internships'}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={isProcessing}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    disabled={isProcessing}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
