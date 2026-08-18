import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'
import { logAdminAction } from '../../utils/logging'
import { getProfilePictureUrl } from '../../utils/api'
import toast from 'react-hot-toast'
import {
  UserCheck,
  UserX,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  Mail,
  Shield,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCheck,
  Calendar,
  Sparkles
} from 'lucide-react'

export default function PendingAccounts() {
  const { profile: currentAdmin } = useAuth()
  const [pendingAccounts, setPendingAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [isBulkLoading, setIsBulkLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [viewAccount, setViewAccount] = useState(null)
  const [rejectAccount, setRejectAccount] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // Fetch all pending accounts
  const fetchPendingAccounts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPendingAccounts(data || [])
    } catch (err) {
      console.error('Error fetching pending accounts:', err)
      toast.error(err.message || 'Failed to load pending accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingAccounts()
  }, [])

  // Approve single account
  const handleApprove = async (account) => {
    try {
      setActionLoadingId(account.id)

      // 1. Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id)

      if (profileError) throw profileError

      // 2. Insert notification for user
      await supabase.from('notifications').insert({
        user_id: account.id,
        type: 'user_approval',
        message: 'Your account registration has been approved! You now have full platform access.',
        is_read: false,
        metadata: { status: 'approved', approved_at: new Date().toISOString() },
      })

      // 3. Log admin action
      await logAdminAction(
        'approve_account',
        'profile',
        account.id,
        `Approved ${account.role} account for ${account.email}`,
        { userId: account.id, email: account.email, role: account.role }
      )

      toast.success(`Account for ${account.full_name || account.email} approved!`)
      setPendingAccounts((prev) => prev.filter((a) => a.id !== account.id))
      if (viewAccount?.id === account.id) setViewAccount(null)
    } catch (err) {
      console.error('Error approving account:', err)
      toast.error(err.message || 'Failed to approve account')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Reject single account with reason
  const handleReject = async () => {
    if (!rejectAccount) return

    try {
      setActionLoadingId(rejectAccount.id)

      // 1. Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          approval_status: 'rejected',
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rejectAccount.id)

      if (profileError) throw profileError

      // 2. Insert notification for user
      const message = rejectReason.trim()
        ? `Your account registration was not approved. Reason: ${rejectReason.trim()}`
        : 'Your account registration was reviewed and not approved at this time.'

      await supabase.from('notifications').insert({
        user_id: rejectAccount.id,
        type: 'user_approval',
        message,
        is_read: false,
        metadata: {
          status: 'rejected',
          reason: rejectReason.trim() || null,
          rejected_at: new Date().toISOString(),
        },
      })

      // 3. Log admin action
      await logAdminAction(
        'reject_account',
        'profile',
        rejectAccount.id,
        `Rejected ${rejectAccount.role} account for ${rejectAccount.email}: ${rejectReason || 'No reason specified'}`,
        { userId: rejectAccount.id, email: rejectAccount.email, reason: rejectReason }
      )

      toast.success(`Account for ${rejectAccount.email} rejected`)
      setPendingAccounts((prev) => prev.filter((a) => a.id !== rejectAccount.id))
      setRejectAccount(null)
      setRejectReason('')
      if (viewAccount?.id === rejectAccount.id) setViewAccount(null)
    } catch (err) {
      console.error('Error rejecting account:', err)
      toast.error(err.message || 'Failed to reject account')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Bulk Approve All Filtered
  const handleBulkApprove = async () => {
    if (filteredAccounts.length === 0) return

    if (
      !window.confirm(
        `Are you sure you want to approve all ${filteredAccounts.length} currently listed pending accounts?`
      )
    ) {
      return
    }

    try {
      setIsBulkLoading(true)
      const ids = filteredAccounts.map((a) => a.id)

      // 1. Bulk update profiles
      const { error: bulkError } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .in('id', ids)

      if (bulkError) throw bulkError

      // 2. Send notifications to all
      const notifications = ids.map((id) => ({
        user_id: id,
        type: 'user_approval',
        message: 'Your account registration has been approved! You now have full platform access.',
        is_read: false,
        metadata: { status: 'approved', approved_at: new Date().toISOString() },
      }))
      await supabase.from('notifications').insert(notifications)

      // 3. Log admin action
      await logAdminAction(
        'bulk_approve_accounts',
        'profile',
        null,
        `Bulk approved ${ids.length} pending accounts`,
        { accountCount: ids.length, accountIds: ids }
      )

      toast.success(`Successfully approved ${ids.length} accounts!`)
      setPendingAccounts((prev) => prev.filter((a) => !ids.includes(a.id)))
    } catch (err) {
      console.error('Error bulk approving accounts:', err)
      toast.error(err.message || 'Failed to bulk approve accounts')
    } finally {
      setIsBulkLoading(false)
    }
  }

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return pendingAccounts.filter((a) => {
      if (roleFilter !== 'all' && a.role !== roleFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const name = (a.full_name || '').toLowerCase()
        const org = (a.organization_name || '').toLowerCase()
        const email = (a.email || '').toLowerCase()
        return name.includes(q) || org.includes(q) || email.includes(q)
      }
      return true
    })
  }, [pendingAccounts, roleFilter, searchQuery])

  const getRoleBadge = (role) => {
    const map = {
      software_house: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      university: 'bg-blue-100 text-blue-700 border-blue-200',
      student: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      guest: 'bg-gray-100 text-gray-700 border-gray-200',
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
    }
    const labels = {
      software_house: 'Software House',
      university: 'University',
      student: 'Student',
      guest: 'Guest',
      admin: 'Admin',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[role] || 'bg-gray-100 text-gray-700'}`}>
        {labels[role] || role}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-7 h-7 text-amber-600" />
            <h1 className="text-2xl font-bold text-gray-800">Pending Account Approvals</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Review and verify new user registrations requiring administrator approval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {filteredAccounts.length > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={isBulkLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              {isBulkLoading ? 'Approving...' : `Approve All (${filteredAccounts.length})`}
            </button>
          )}
          <button
            onClick={fetchPendingAccounts}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Pending</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{pendingAccounts.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Software Houses / Unis</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">
              {pendingAccounts.filter((a) => a.role === 'software_house' || a.role === 'university').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Students / Guests</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">
              {pendingAccounts.filter((a) => a.role === 'student' || a.role === 'guest').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pending users by name, organization, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
              className="px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="software_house">Software House</option>
              <option value="university">University</option>
              <option value="guest">Guest</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pending Accounts Grid / List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 flex flex-col items-center justify-center">
          <div className="w-9 h-9 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading pending requests...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800">All caught up!</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            There are currently no pending account signups waiting for approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.map((account) => {
            const pictureUrl = account.profile_picture ? getProfilePictureUrl(account.profile_picture) : null
            const displayName = account.organization_name || account.full_name || 'New User'
            const initials = displayName[0]?.toUpperCase() || account.email?.[0]?.toUpperCase() || 'U'
            const isProcessing = actionLoadingId === account.id

            return (
              <div
                key={account.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative"
              >
                <div>
                  {/* Top Card Bar */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {pictureUrl ? (
                        <img
                          src={pictureUrl}
                          alt={displayName}
                          className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextElementSibling
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm ${
                          pictureUrl ? 'hidden' : 'flex'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{displayName}</h3>
                        <p className="text-xs text-gray-500 truncate">{account.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badges and Info */}
                  <div className="space-y-2.5 my-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Account Type:</span>
                      {getRoleBadge(account.role)}
                    </div>
                    {account.organization_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Organization:</span>
                        <span className="font-medium text-gray-800 truncate max-w-[160px]">{account.organization_name}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Signed Up:</span>
                      <span className="font-medium text-gray-800">
                        {account.created_at ? new Date(account.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
                  <button
                    onClick={() => setViewAccount(account)}
                    className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setRejectAccount(account)
                      setRejectReason('')
                    }}
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Reject
                  </button>

                  <button
                    onClick={() => handleApprove(account)}
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {isProcessing ? 'Saving...' : 'Approve'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Account Detail Modal */}
      {viewAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewAccount(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                {(viewAccount.organization_name || viewAccount.full_name || viewAccount.email)[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {viewAccount.organization_name || viewAccount.full_name || 'Pending Account'}
                </h3>
                <p className="text-sm text-gray-500">{viewAccount.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  {getRoleBadge(viewAccount.role)}
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    Pending Approval
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Full Name</span>
                <span className="font-medium text-gray-800">{viewAccount.full_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Organization Name</span>
                <span className="font-medium text-gray-800">{viewAccount.organization_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Email Address</span>
                <span className="font-medium text-gray-800">{viewAccount.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">User ID</span>
                <span className="font-mono text-xs text-gray-800">{viewAccount.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Registered On</span>
                <span className="text-gray-800">
                  {viewAccount.created_at ? new Date(viewAccount.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setViewAccount(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setRejectAccount(viewAccount)
                  setViewAccount(null)
                }}
                className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-sm font-medium rounded-lg"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(viewAccount)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm"
              >
                Approve Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal with Reason */}
      {rejectAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Account Application</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to reject the application for{' '}
              <span className="font-semibold text-gray-800">{rejectAccount.email}</span>?
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Reason / Feedback (Sent to user)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Optional explanation for why this application was rejected..."
                rows={4}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectAccount(null)
                  setRejectReason('')
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoadingId === rejectAccount.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
