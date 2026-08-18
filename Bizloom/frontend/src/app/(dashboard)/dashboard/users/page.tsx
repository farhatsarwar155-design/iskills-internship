'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, UserPlus, ShieldCheck, CheckCircle2, XCircle,
  Trash2, RefreshCw, Mail, Calendar, Clock, ChevronRight,
  X, Shield, KeyRound, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'ACCOUNTANT';
  isVerified: boolean;
  createdAt: string;
  lastLogin: string | null;
}

const ROLE_META: Record<string, { color: string; bg: string; border: string; label: string; permissions: string[] }> = {
  ADMIN: {
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-900/40',
    label: 'Full System Access',
    permissions: ['All Modules', 'User Management', 'System Logs', 'Finance & Analytics', 'RBAC Control'],
  },
  MANAGER: {
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-900/40',
    label: 'Operations & HR',
    permissions: ['Inventory Control', 'Sales & Invoicing', 'Customer Database', 'Suppliers', 'Purchase Orders', 'HR Directory', 'Attendance'],
  },
  EMPLOYEE: {
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-900/40',
    label: 'Basic Operations',
    permissions: ['Inventory (View)', 'Sales (Create)', 'Attendance (Self)', 'Calendar', 'Tasks'],
  },
  ACCOUNTANT: {
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-900/40',
    label: 'Finance & Reporting',
    permissions: ['Finance Ledger', 'Analytics', 'Sales & Invoicing', 'Customer Database', 'Suppliers', 'Purchase Orders'],
  },
};

function getInitials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
}

function fmtDate(d: string | null) {
  if (!d) return 'Never';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(d: string | null) {
  if (!d) return 'Never';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [newRole, setNewRole] = useState<UserRecord['role']>('EMPLOYEE');
  const [creating, setCreating] = useState(false);

  // Detail panel edits
  const [editingRole, setEditingRole] = useState<UserRecord['role'] | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      const list: UserRecord[] = res.data.users || [];
      setUsers(list);
      // Keep selected user in sync
      if (selectedUser) {
        const refreshed = list.find(u => u.id === selectedUser.id);
        setSelectedUser(refreshed || null);
        if (refreshed) setEditingRole(refreshed.role);
      }
    } catch (err: any) {
      toast.error('Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (u: UserRecord) => {
    if (selectedUser?.id === u.id) {
      setSelectedUser(null);
    } else {
      setSelectedUser(u);
      setEditingRole(u.role);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    setCreating(true);
    try {
      await api.post('/auth/users', { name: newName, email: newEmail, password: newPassword, role: newRole });
      toast.success(`Account for ${newEmail} created successfully!`);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setShowAddModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !editingRole || editingRole === selectedUser.role) return;
    setSaving(true);
    try {
      await api.patch(`/auth/users/${selectedUser.id}`, { role: editingRole });
      toast.success(`Role updated to ${editingRole}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u: UserRecord) => {
    try {
      await api.patch(`/auth/users/${u.id}`, { isVerified: !u.isVerified });
      toast.success(`Account status for ${u.email} updated`);
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!confirm(`Permanently delete account for ${selectedUser.email}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/auth/users/${selectedUser.id}`);
      toast.success('User account deleted');
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <ShieldCheck className="h-10 w-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-rose-500">Access Restricted</h3>
        <p className="text-xs text-neutral-500 mt-1">Only system administrators can access User Management.</p>
      </div>
    );
  }

  const roleMeta = selectedUser ? ROLE_META[selectedUser.role] : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              User Management
            </h1>
            <span className="flex h-6 items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3" /> Admin Access Only
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-semibold">
            Manage system accounts, assign role-based permissions (RBAC), and inspect user details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl text-neutral-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <UserPlus className="h-4 w-4" /> Add New User
          </Button>
        </div>
      </div>

      {/* Main Layout: User List + Side Detail Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: User Table / Cards */}
        <div className={`w-full transition-all duration-300 ${selectedUser ? 'lg:w-3/5' : 'lg:w-full'}`}>
          <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                  Registered Accounts ({users.length})
                </CardTitle>
                <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">
                  Click on any user row to view details in the side panel.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-xs text-neutral-400">Loading user records...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-neutral-950/50 text-[10px] uppercase tracking-wider text-neutral-400 font-black border-b border-neutral-100 dark:border-neutral-800">
                      <tr>
                        <th className="p-3.5">Name</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Last Login</th>
                        <th className="p-3.5">Date Joined</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {users.map(u => {
                        const meta = ROLE_META[u.role] || ROLE_META.EMPLOYEE;
                        const isSelected = selectedUser?.id === u.id;
                        return (
                          <tr
                            key={u.id}
                            onClick={() => handleSelectUser(u)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-l-4 border-l-indigo-600'
                                : 'hover:bg-slate-50/70 dark:hover:bg-neutral-800/50'
                            }`}
                          >
                            <td className="p-3.5 font-bold text-neutral-800 dark:text-neutral-200">
                              <div className="flex items-center gap-2.5">
                                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${meta.bg} ${meta.color}`}>
                                  {getInitials(u.name)}
                                </div>
                                <span className="truncate">{u.name}</span>
                                {u.id === currentUser?.id && (
                                  <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 rounded-full border border-indigo-200 dark:border-indigo-900/40">YOU</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 text-neutral-600 dark:text-neutral-400 font-medium">
                              {u.email}
                            </td>
                            <td className="p-3.5" onClick={e => e.stopPropagation()}>
                              <select
                                value={u.role}
                                disabled={u.id === currentUser?.id}
                                onChange={async (e) => {
                                  const newR = e.target.value as UserRecord['role'];
                                  try {
                                    await api.patch(`/auth/users/${u.id}`, { role: newR });
                                    toast.success(`Role updated to ${newR}`);
                                    fetchUsers();
                                  } catch (err: any) {
                                    toast.error(err.response?.data?.message || 'Failed to update role');
                                  }
                                }}
                                className={`text-[10px] font-black px-2 py-1 rounded-lg border ${meta.bg} ${meta.color} ${meta.border} disabled:opacity-50 cursor-pointer outline-none`}
                              >
                                <option value="ADMIN">ADMIN</option>
                                <option value="MANAGER">MANAGER</option>
                                <option value="EMPLOYEE">EMPLOYEE</option>
                                <option value="ACCOUNTANT">ACCOUNTANT</option>
                              </select>
                            </td>
                            <td className="p-3.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleToggleStatus(u)}
                                disabled={u.id === currentUser?.id}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border transition-colors cursor-pointer disabled:opacity-50 ${
                                  u.isVerified
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100'
                                    : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-100'
                                }`}
                              >
                                {u.isVerified ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                {u.isVerified ? 'Active' : 'Pending Verification'}
                              </button>
                            </td>
                            <td className="p-3.5 text-neutral-500 dark:text-neutral-400 font-medium">
                              {fmtDateTime(u.lastLogin)}
                            </td>
                            <td className="p-3.5 text-neutral-500 dark:text-neutral-400 font-medium">
                              {fmtDate(u.createdAt)}
                            </td>
                            <td className="p-3.5 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                {u.id !== currentUser?.id && (
                                  <button
                                    onClick={() => {
                                      setSelectedUser(u);
                                      if (confirm(`Permanently delete account for ${u.email}?`)) {
                                        api.delete(`/auth/users/${u.id}`).then(() => {
                                          toast.success('User account deleted');
                                          setSelectedUser(null);
                                          fetchUsers();
                                        }).catch(err => {
                                          toast.error(err.response?.data?.message || 'Failed to delete user');
                                        });
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                                <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'translate-x-1 text-indigo-600 dark:text-indigo-400' : 'text-neutral-300'}`} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: User Details Side Panel */}
        {selectedUser && roleMeta && (
          <div className="w-full lg:w-2/5 animate-fade-slide-up">
            <Card className="rounded-2xl border border-indigo-100 dark:border-indigo-950/50 bg-white dark:bg-neutral-900 shadow-md overflow-hidden sticky top-6">
              {/* Header */}
              <div className={`p-5 border-b border-neutral-100 dark:border-neutral-800 ${roleMeta.bg}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-black shadow-sm border-2 ${roleMeta.border} bg-white dark:bg-neutral-900 ${roleMeta.color}`}>
                      {getInitials(selectedUser.name)}
                    </div>
                    <div>
                      <h2 className="text-base font-black text-neutral-900 dark:text-white leading-tight">
                        {selectedUser.name}
                      </h2>
                      <p className="text-xs text-neutral-500 font-medium flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" /> {selectedUser.email}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${roleMeta.bg} ${roleMeta.color} ${roleMeta.border}`}>
                          <Shield className="h-3 w-3" /> {selectedUser.role}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          selectedUser.isVerified
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}>
                          {selectedUser.isVerified ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5">
                {/* Information Metadata Cards */}
                <div>
                  <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                    Account Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800/80">
                      <div className="text-[10px] font-bold text-neutral-400 flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" /> Registered On
                      </div>
                      <div className="font-extrabold text-neutral-800 dark:text-neutral-200">
                        {fmtDate(selectedUser.createdAt)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800/80">
                      <div className="text-[10px] font-bold text-neutral-400 flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" /> Last Active
                      </div>
                      <div className="font-extrabold text-neutral-800 dark:text-neutral-200 truncate">
                        {fmtDateTime(selectedUser.lastLogin)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800/80 col-span-2">
                      <div className="text-[10px] font-bold text-neutral-400 flex items-center gap-1 mb-1">
                        <KeyRound className="h-3 w-3" /> System Identifier (ID)
                      </div>
                      <div className="font-mono text-[11px] font-bold text-neutral-600 dark:text-neutral-400 truncate">
                        {selectedUser.id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role & Permissions Breakdown */}
                <div>
                  <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                    Access & Module Permissions
                  </h3>
                  <div className={`p-3.5 rounded-xl border ${roleMeta.border} ${roleMeta.bg} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${roleMeta.color}`}>{roleMeta.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {roleMeta.permissions.map(p => (
                        <span key={p} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Actions (Update Role, Status, Delete) */}
                <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    Administrative Actions
                  </h3>

                  {/* Change Role */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                      Change Role (RBAC)
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={editingRole || selectedUser.role}
                        onChange={e => setEditingRole(e.target.value as UserRecord['role'])}
                        disabled={selectedUser.id === currentUser?.id}
                        className="flex-1 h-9 px-3 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 disabled:opacity-50"
                      >
                        <option value="ADMIN">ADMIN (Full Access)</option>
                        <option value="MANAGER">MANAGER (Operations & HR)</option>
                        <option value="EMPLOYEE">EMPLOYEE (Basic Operations)</option>
                        <option value="ACCOUNTANT">ACCOUNTANT (Finance & Reporting)</option>
                      </select>
                      <Button
                        onClick={handleSaveRole}
                        disabled={saving || editingRole === selectedUser.role || selectedUser.id === currentUser?.id}
                        className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>

                  {/* Toggle Active/Inactive */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Account Status</span>
                    <button
                      onClick={() => handleToggleStatus(selectedUser)}
                      disabled={selectedUser.id === currentUser?.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedUser.isVerified
                          ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100'
                      }`}
                    >
                      {selectedUser.isVerified ? 'Deactivate Account' : 'Activate Account'}
                    </button>
                  </div>

                  {/* Delete User */}
                  {selectedUser.id !== currentUser?.id && (
                    <div className="pt-2">
                      <button
                        onClick={handleDeleteUser}
                        disabled={deleting}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deleting ? 'Deleting...' : 'Delete User Account'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Create New Account</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-neutral-400 hover:text-neutral-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="jane@company.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full h-9 px-3 pr-9 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRecord['role'])}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200"
                >
                  <option value="ADMIN">ADMIN — Full Access</option>
                  <option value="MANAGER">MANAGER — Operations & HR</option>
                  <option value="EMPLOYEE">EMPLOYEE — Basic Operations</option>
                  <option value="ACCOUNTANT">ACCOUNTANT — Finance & Reporting</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="h-9 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

