import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'
import { logAdminAction } from '../../utils/logging'
import { getProfilePictureUrl } from '../../utils/api'
import toast from 'react-hot-toast'
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  UserCheck,
  UserX,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  Building,
  GraduationCap,
  Calendar,
  AlertCircle
} from 'lucide-react'

export default function UserManagement() {
  const { profile: currentAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editRoleUser, setEditRoleUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Fetch users from profiles table
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      toast.error(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Toggle user active status
  const handleToggleActive = async (user) => {
    const nextState = !user.is_active
    const actionLabel = nextState ? 'activate' : 'deactivate'
    
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${user.full_name || user.email}?`)) {
      return
    }

    try {
      setActionLoadingId(user.id)

      // Update via supabase directly
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: nextState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      // Log the admin action
      await logAdminAction(
        nextState ? 'activate_user' : 'deactivate_user',
        'profile',
        user.id,
        `Admin ${currentAdmin?.email || 'admin'} ${actionLabel}d user ${user.email}`,
        { userId: user.id, email: user.email, is_active: nextState }
      )

      toast.success(`User ${user.email} ${nextState ? 'activated' : 'deactivated'} successfully!`)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextState } : u))
      )
    } catch (err) {
      console.error(`Error toggling user active status:`, err)
      toast.error(err.message || `Failed to ${actionLabel} user`)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Handle role change
  const handleRoleChange = async () => {
    if (!editRoleUser || !newRole) return

    try {
      setActionLoadingId(editRoleUser.id)
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editRoleUser.id)

      if (error) throw error

      await logAdminAction(
        'update_user_role',
        'profile',
        editRoleUser.id,
        `Changed role from ${editRoleUser.role} to ${newRole} for ${editRoleUser.email}`,
        { userId: editRoleUser.id, oldRole: editRoleUser.role, newRole }
      )

      toast.success(`Role updated to ${newRole} for ${editRoleUser.email}`)
      setUsers((prev) =>
        prev.map((u) => (u.id === editRoleUser.id ? { ...u, role: newRole } : u))
      )
      setEditRoleUser(null)
    } catch (err) {
      console.error('Error changing role:', err)
      toast.error(err.message || 'Failed to update role')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) {
        return false
      }

      // Status filter
      if (statusFilter === 'active' && !u.is_active) return false
      if (statusFilter === 'inactive' && u.is_active) return false
      if (statusFilter === 'approved' && u.approval_status !== 'approved') return false
      if (statusFilter === 'pending' && u.approval_status !== 'pending') return false
      if (statusFilter === 'rejected' && u.approval_status !== 'rejected') return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const name = (u.full_name || '').toLowerCase()
        const org = (u.organization_name || '').toLowerCase()
        const email = (u.email || '').toLowerCase()
        return name.includes(q) || org.includes(q) || email.includes(q)
      }

      return true
    })
  }, [users, roleFilter, statusFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, page, pageSize])

  // Summary Metrics
  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.is_active).length
    const pending = users.filter((u) => u.approval_status === 'pending').length
    const roles = {
      student: users.filter((u) => u.role === 'student').length,
      guest: users.filter((u) => u.role === 'guest').length,
      software_house: users.filter((u) => u.role === 'software_house').length,
      university: users.filter((u) => u.role === 'university').length,
      admin: users.filter((u) => u.role === 'admin').length,
    }
    return { total, active, pending, roles }
  }, [users])

  const getRoleBadge = (role) => {
    const map = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      software_house: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      university: 'bg-blue-100 text-blue-700 border-blue-200',
      student: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      guest: 'bg-gray-100 text-gray-700 border-gray-200',
    }
    const labels = {
      admin: 'Admin',
      software_house: 'Software House',
      university: 'University',
      student: 'Student',
      guest: 'Guest',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[role] || 'bg-gray-100 text-gray-700'}`}>
        {labels[role] || role}
      </span>
    )
  }

  const getApprovalBadge = (status) => {
    const map = {
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            View, search, filter, and manage platform accounts, roles, and access statuses.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active Users</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pending Approvals</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Inactive Accounts</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.total - stats.active}</p>
        </div>
      </div>

      {/* Search & Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, organization, or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by role"
              className="px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="student">Student ({stats.roles.student})</option>
              <option value="guest">Guest ({stats.roles.guest})</option>
              <option value="software_house">Software House ({stats.roles.software_house})</option>
              <option value="university">University ({stats.roles.university})</option>
              <option value="admin">Admin ({stats.roles.admin})</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by status"
              className="px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Approval</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-400 self-center mr-1">Quick Filter:</span>
          {['all', 'student', 'software_house', 'university', 'guest', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => {
                setRoleFilter(r)
                setPage(1)
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                roleFilter === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r === 'all' ? 'All Roles' : r === 'software_house' ? 'Software Houses' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500">Loading user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-700">No users found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search query or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">User / Organization</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Active Status</th>
                  <th className="py-3.5 px-6">Approval</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {paginatedUsers.map((user) => {
                  const pictureUrl = user.profile_picture ? getProfilePictureUrl(user.profile_picture) : null
                  const displayName = user.full_name || user.organization_name || 'Unnamed'
                  const initials = displayName[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'
                  const isActionLoading = actionLoadingId === user.id

                  return (
                    <tr key={user.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {pictureUrl ? (
                            <img
                              src={pictureUrl}
                              alt={displayName}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm ${
                              pictureUrl ? 'hidden' : 'flex'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate max-w-xs">{displayName}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">{getRoleBadge(user.role)}</td>
                      <td className="py-4 px-6">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">{getApprovalBadge(user.approval_status)}</td>
                      <td className="py-4 px-6 text-gray-500 text-xs">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) : '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowDetailModal(true)
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditRoleUser(user)
                              setNewRole(user.role)
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Change role"
                          >
                            <Shield className="w-4 h-4" />
                          </button>

                          {user.is_active ? (
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                              title="Deactivate user"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                              title="Activate user"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} users</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                aria-label="Users per page"
                className="ml-2 border border-gray-200 rounded px-2 py-1 bg-white"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
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

      {/* User Details Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowDetailModal(false)
                setSelectedUser(null)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                {(selectedUser.full_name || selectedUser.organization_name || selectedUser.email)[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedUser.full_name || selectedUser.organization_name || 'User Profile'}
                </h3>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  {getRoleBadge(selectedUser.role)}
                  {getApprovalBadge(selectedUser.approval_status)}
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">User ID</span>
                <span className="font-mono text-xs text-gray-800 break-all">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Organization Name</span>
                <span className="font-medium text-gray-800">{selectedUser.organization_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Active Status</span>
                <span className={`font-semibold ${selectedUser.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Approval Status</span>
                <span className="font-semibold text-gray-800 capitalize">{selectedUser.approval_status || 'Pending'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Created At</span>
                <span className="text-gray-800">
                  {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-800">
                  {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedUser(null)
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  handleToggleActive(selectedUser)
                }}
                className={`px-4 py-2 text-white text-sm font-medium rounded-lg ${
                  selectedUser.is_active ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Change User Role</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select a new role for <span className="font-semibold text-gray-800">{editRoleUser.email}</span>.
            </p>

            <div className="space-y-2 mb-6">
              {[
                { id: 'student', name: 'Student', desc: 'Can browse internships and apply' },
                { id: 'guest', name: 'Guest', desc: 'Limited preview permissions' },
                { id: 'software_house', name: 'Software House', desc: 'Can post internships and review applicants' },
                { id: 'university', name: 'University', desc: 'Can manage enrolled student accounts' },
                { id: 'admin', name: 'Admin', desc: 'Full platform administrative privileges' },
              ].map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    newRole === r.id
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="roleOption"
                      value={r.id}
                      checked={newRole === r.id}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditRoleUser(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={actionLoadingId === editRoleUser.id || newRole === editRoleUser.role}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
