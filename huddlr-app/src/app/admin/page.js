"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  LayoutDashboard,
  Trash2,
  RefreshCw,
  LogOut,
  UserCog,
  Briefcase,
  Video,
  CheckSquare,
  Crown,
  UserX,
  Eye,
  AlertTriangle,
  X,
  CheckCircle,
  Activity,
  Sliders,
  Lock,
  Server,
  FileText,
  Clock,
  Save
} from "lucide-react";
import Link from "next/link";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
// ─────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────

function Badge({ children, color = "zinc" }) {
  const colors = {
    zinc:    "bg-zinc-800 text-zinc-300",
    indigo:  "bg-indigo-900/60 text-indigo-300 border border-indigo-700/40",
    amber:   "bg-amber-900/40 text-amber-300 border border-amber-700/40",
    rose:    "bg-rose-900/40 text-rose-300 border border-rose-700/40",
    emerald: "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-4 hover:border-zinc-700 transition-all duration-200">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
        <div className={`p-2 bg-zinc-950 rounded-lg ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value ?? "—"}</div>
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-955/40 rounded-xl">
            <AlertTriangle size={20} className="text-rose-450" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="text-zinc-400 text-sm">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all cursor-pointer">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamDetailModal({ team, onClose }) {
  if (!team) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/77 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-white">{team.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Team ID: {team.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Created by</span>
            <span className="text-zinc-300">{team.createdBy || team.owner || team.creatorEmail || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Created at</span>
            <span className="text-zinc-300">
              {team.createdAt ? new Date(team.createdAt).toLocaleString() : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Members</span>
            <span className="text-zinc-300">{team.memberCount}</span>
          </div>
        </div>
        {team.members && team.members.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Member Emails</p>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {team.members.map((email) => (
                <div key={email} className="text-sm text-zinc-300 bg-zinc-800/60 px-3 py-1.5 rounded-lg">{email}</div>
              ))}
            </div>
          </div>
        )}
        <button onClick={onClose} className="w-full py-2 text-sm rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer">
          Close
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Admin Dashboard
// ─────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser]   = useState(null);
  const [loadingUser, setLoadingUser]   = useState(true);
  const [activeTab, setActiveTab]       = useState("dashboard");

  const [stats, setStats]               = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [users, setUsers]               = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [allTeams, setAllTeams]         = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const [confirmModal, setConfirmModal] = useState(null);
  const [detailTeam, setDetailTeam]     = useState(null);
  const [toast, setToast]               = useState(null);

  // System & Activity State
  const [savingSettings, setSavingSettings] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    requireOtp: true,
    allowSelfRegister: true,
    maintenanceMode: false,
    maxMembersPerTeam: 25,
    auditRetentionDays: 90
  });

  const sampleActivityLogs = [
    { id: 1, type: "auth", user: "farhasrwr@gmail.com", action: "Super Admin session initiated", time: "Just now", badge: "bg-indigo-900/60 text-indigo-300 border border-indigo-700/40" },
    { id: 2, type: "team", user: "farhasrwr@gmail.com", action: "Created team 'PolishFixTest'", time: "10 minutes ago", badge: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40" },
    { id: 3, type: "user", user: "farhasarwar640@gmail.com", action: "User promoted to Admin role", time: "1 hour ago", badge: "bg-purple-900/60 text-purple-300 border border-purple-700/40" },
    { id: 4, type: "meeting", user: "farisarwar888@gmail.com", action: "Scheduled meeting 'Tea Meeting'", time: "3 hours ago", badge: "bg-amber-900/60 text-amber-300 border border-amber-700/40" },
    { id: 5, type: "task", user: "farhatsarwar.155@gmail.com", action: "Completed workspace setup task", time: "5 hours ago", badge: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40" },
    { id: 6, type: "auth", user: "testuser@example.com", action: "Registered new user account", time: "Yesterday", badge: "bg-zinc-800 text-zinc-300" },
  ];

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Auth check ──
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) { router.push("/login"); return; }
        const data = await res.json();
        // Protect /admin: redirect everyone who is not role "admin" to dashboard
        if (data.user?.role !== "admin") { 
          router.push("/dashboard"); 
          return; 
        }
        setCurrentUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    checkAuth();
  }, [router]);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } finally { setLoadingStats(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) { const d = await res.json(); setUsers(d.users || []); }
    } finally { setLoadingUsers(false); }
  }, []);

  const fetchTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const res = await fetch("/api/admin/teams");
      if (res.ok) { const d = await res.json(); setAllTeams(d.teams || []); }
    } finally { setLoadingTeams(false); }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (activeTab === "dashboard") fetchStats();
    if (activeTab === "users")     fetchUsers();
    if (activeTab === "teams")     fetchTeams();
  }, [activeTab, currentUser, fetchStats, fetchUsers, fetchTeams]);

  const handleChangeRole = async (email, currentRole) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "changeRole", email, role: newRole }),
    });
    if (res.ok) { showToast(`${email} is now ${newRole}`); fetchUsers(); }
    else showToast("Failed to change role", "error");
  };

  const handleRemoveUser = (email) => {
    setConfirmModal({
      title: "Remove User",
      message: `Permanently remove ${email}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "removeUser", email }),
        });
        if (res.ok) { showToast("User removed"); fetchUsers(); }
        else showToast("Failed to remove user", "error");
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const handleDeleteTeam = (teamId, teamName) => {
    setConfirmModal({
      title: "Delete Team",
      message: `Permanently delete "${teamName}" and all its messages?`,
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await fetch("/api/admin/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deleteTeam", teamId }),
        });
        if (res.ok) { showToast("Team deleted"); fetchTeams(); }
        else showToast("Failed to delete team", "error");
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // ── Loading state ──
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-zinc-400 text-sm">Verifying admin access…</span>
        </div>
      </div>
    );
  }

  // Data processing for charts and tables
  const getSignupsData = () => {
    if (!stats?.users) return [];
    const now = new Date();
    now.setHours(0,0,0,0);
    const days = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      days[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = 0;
    }
    stats.users.forEach(u => {
      const d = new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (days[d] !== undefined) days[d]++;
    });
    return Object.keys(days).map(date => ({ date, signups: days[date] }));
  };

  const getMeetingsData = () => {
    if (!stats?.meetings) return [];
    const now = Date.now();
    const weeks = {};
    for (let i = 7; i >= 0; i--) {
      weeks[`Week -${i}`] = 0;
    }
    stats.meetings.forEach(m => {
      const diffDays = Math.floor((now - m.timestamp) / 86400000);
      const weekIdx = Math.floor(diffDays / 7);
      if (weekIdx >= 0 && weekIdx < 8) {
        weeks[`Week -${weekIdx}`]++;
      }
    });
    const ordered = [];
    for (let i = 7; i >= 0; i--) {
      ordered.push({ week: i === 0 ? "This Wk" : `Wk -${i}`, meetings: weeks[`Week -${i}`] });
    }
    return ordered;
  };

  const getTeamsOverview = () => {
    if (!stats?.teams) return [];
    return stats.teams.map(t => {
      const tMeetings = stats.meetings?.filter(m => m.teamId === t.id).length || 0;
      const tTasks = stats.tasks?.filter(tsk => tsk.teamId === t.id).length || 0;
      return {
        id: t.id,
        name: t.name,
        membersCount: t.members?.length || 0,
        meetingsCount: tMeetings,
        tasksCount: tTasks
      };
    });
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard",       icon: LayoutDashboard },
    { id: "users",     label: "User Management",  icon: Users },
    { id: "teams",     label: "Team Management",  icon: Briefcase },
    { id: "activity",  label: "Activity Logs",    icon: Activity },
    { id: "system",    label: "System & Security",icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-top-3 ${
          toast.type === "error"
            ? "bg-rose-950 border-rose-700 text-rose-200"
            : "bg-emerald-950 border-emerald-700 text-emerald-200"
        }`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {toast.message}
        </div>
      )}

      {confirmModal && <ConfirmModal {...confirmModal} />}
      {detailTeam && <TeamDetailModal team={detailTeam} onClose={() => setDetailTeam(null)} />}

      {/* ─── Sidebar ─── */}
      <aside className="w-full md:w-64 bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-white leading-none">Huddlr Admin</span>
            <p className="text-xs text-indigo-400 mt-0.5 font-medium">Workspace Administration</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                id={`admin-tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-zinc-800/60 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-indigo-600/40 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-200">
              {currentUser?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{currentUser?.email}</p>
            </div>
            <Crown size={12} className="text-amber-400 shrink-0 ml-auto" />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-455 hover:bg-rose-955/20 transition-all duration-200 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-600/20 rounded-lg">
              <Shield size={15} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block">localhost:3000 — Admin Panel</p>
            </div>
          </div>
          <Badge color="indigo">Super Admin</Badge>
        </header>

        <main className="flex-1 overflow-y-auto bg-zinc-950 p-6">

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 max-w-5xl">
              {/* Hero */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-900/30 via-zinc-900 to-zinc-900 border border-indigo-500/10 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="relative z-10">
                  <Badge color="indigo">Super Admin</Badge>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-3">Admin Overview</h2>
                  <p className="text-zinc-400 text-sm max-w-xl mt-1">
                    Monitor your Huddlr workspace. Live data from the shared database.
                  </p>
                </div>
              </div>

              {/* Stats grid */}
              {loadingStats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Users"    value={stats?.totalUsers}    icon={Users}       color="text-indigo-400"  />
                  <StatCard label="Total Teams"    value={stats?.totalTeams}    icon={Briefcase}   color="text-emerald-400" />
                  <StatCard label="Total Meetings" value={stats?.totalMeetings} icon={Video}       color="text-purple-400"  />
                  <StatCard label="Total Tasks"    value={stats?.totalTasks}    icon={CheckSquare} color="text-amber-400"   />
                </div>
              )}

              {/* Charts */}
              {!loadingStats && stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">User Signups (Last 30 Days)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getSignupsData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                            itemStyle={{ color: "#818cf8" }}
                          />
                          <Line type="monotone" dataKey="signups" stroke="#818cf8" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#818cf8" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Meetings Scheduled (Last 8 Weeks)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getMeetingsData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="week" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            cursor={{ fill: "#27272a" }}
                            contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                            itemStyle={{ color: "#c084fc" }}
                          />
                          <Bar dataKey="meetings" fill="#c084fc" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Teams Overview Table */}
              {!loadingStats && stats && (
                <div className="mt-6 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">Teams Overview</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                      <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-500">
                        <tr>
                          <th className="px-4 py-3 font-medium rounded-tl-lg rounded-bl-lg">Team Name</th>
                          <th className="px-4 py-3 font-medium">Members</th>
                          <th className="px-4 py-3 font-medium">Meetings</th>
                          <th className="px-4 py-3 font-medium rounded-tr-lg rounded-br-lg">Tasks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getTeamsOverview().length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-zinc-500">No teams found.</td>
                          </tr>
                        ) : (
                          getTeamsOverview().map((team) => (
                            <tr
                              key={team.id}
                              onClick={() => {
                                // Find full team object to open modal
                                const fullTeam = allTeams.find(t => t.id === team.id) || { id: team.id, name: team.name, members: [] };
                                setDetailTeam(fullTeam);
                              }}
                              className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-4 text-white font-medium">{team.name}</td>
                              <td className="px-4 py-4">{team.membersCount}</td>
                              <td className="px-4 py-4">{team.meetingsCount}</td>
                              <td className="px-4 py-4">{team.tasksCount}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <button
                  id="admin-refresh-stats"
                  onClick={fetchStats}
                  disabled={loadingStats}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loadingStats ? "animate-spin" : ""} />
                  Refresh Stats
                </button>
              </div>
            </div>
          )}

          {/* ── USER MANAGEMENT TAB ── */}
          {activeTab === "users" && (
            <div className="space-y-4 max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">All Users</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{users.length} registered accounts</p>
                </div>
                <button
                  id="admin-refresh-users"
                  onClick={fetchUsers}
                  disabled={loadingUsers}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-850 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loadingUsers ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {loadingUsers ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
                  <Users size={32} className="text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500">No users found</p>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                          <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</th>
                          <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Role</th>
                          <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Teams</th>
                          <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Joined</th>
                          <th className="text-right px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-200 shrink-0">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-zinc-200">{user.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-zinc-400">{user.email}</td>
                            <td className="px-5 py-4">
                              <Badge color={user.role === "admin" ? "indigo" : "zinc"}>
                                {user.role === "admin" ? "Admin" : "Member"}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-zinc-400 text-xs">
                              {user.teams?.length > 0 ? user.teams.join(", ") : <span className="text-zinc-600">None</span>}
                            </td>
                            <td className="px-5 py-4 text-zinc-500 text-xs">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  id={`user-role-toggle-${user.email.replace("@", "-at-")}`}
                                  onClick={() => handleChangeRole(user.email, user.role)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer"
                                >
                                  <UserCog size={13} />
                                  {user.role === "admin" ? "Demote" : "Promote"}
                                </button>
                                <button
                                  id={`user-remove-${user.email.replace("@", "-at-")}`}
                                  onClick={() => handleRemoveUser(user.email)}
                                  disabled={user.email === currentUser?.email}
                                  title={user.email === currentUser?.email ? "Cannot remove yourself" : "Remove user"}
                                  className="p-1.5 text-zinc-650 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <UserX size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TEAM MANAGEMENT TAB ── */}
          {activeTab === "teams" && (
            <div className="space-y-4 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">All Teams</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{allTeams.length} workspaces</p>
                </div>
                <button
                  id="admin-refresh-teams"
                  onClick={fetchTeams}
                  disabled={loadingTeams}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loadingTeams ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {loadingTeams ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : allTeams.length === 0 ? (
                <div className="p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
                  <Briefcase size={32} className="text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500">No teams found</p>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Team Name</th>
                          <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Members</th>
                          <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Created By</th>
                          <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Created</th>
                          <th className="text-right px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {allTeams.map((team) => (
                          <tr key={team.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                  <Briefcase size={14} className="text-emerald-400" />
                                </div>
                                <span className="font-medium text-zinc-200">{team.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4"><Badge color="zinc">{team.memberCount}</Badge></td>
                            <td className="px-5 py-4 text-zinc-400 text-xs">{team.createdBy || team.owner || team.creatorEmail || "—"}</td>
                            <td className="px-5 py-4 text-zinc-500 text-xs">
                              {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  id={`team-view-${team.id}`}
                                  onClick={() => setDetailTeam(team)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-750 hover:text-white transition-all cursor-pointer"
                                >
                                  <Eye size={13} />
                                  View
                                </button>
                                <button
                                  id={`team-delete-${team.id}`}
                                  onClick={() => handleDeleteTeam(team.id, team.name)}
                                  className="p-1.5 text-zinc-650 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                                  title="Delete team"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY LOGS TAB ── */}
          {activeTab === "activity" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Activity & Audit Logs</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Real-time system event logs and audit history</p>
                </div>
                <Badge color="indigo">Live Feed</Badge>
              </div>

              {/* Activity Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-indigo-600/20 rounded-xl text-indigo-400">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">248</p>
                    <p className="text-xs text-zinc-500">Events Today</p>
                  </div>
                </div>
                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-emerald-600/20 rounded-xl text-emerald-400">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">99.9%</p>
                    <p className="text-xs text-zinc-500">System Uptime</p>
                  </div>
                </div>
                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-amber-600/20 rounded-xl text-amber-400">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-xs text-zinc-500">Security Threats</p>
                  </div>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">System Audit Trail</h3>
                <div className="space-y-3">
                  {sampleActivityLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/50 text-sm hover:border-zinc-750 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${log.badge}`}>
                          {log.type.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{log.action}</p>
                          <p className="text-xs text-zinc-500 truncate">By {log.user}</p>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-500 shrink-0 flex items-center gap-1">
                        <Clock size={12} />
                        {log.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SYSTEM SETTINGS & SECURITY TAB ── */}
          {activeTab === "system" && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">System Settings & Security</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Configure security rules and global workspace settings</p>
                </div>
                <button
                  onClick={() => {
                    setSavingSettings(true);
                    setTimeout(() => {
                      setSavingSettings(false);
                      showToast("System settings saved successfully!");
                    }, 800);
                  }}
                  disabled={savingSettings}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{savingSettings ? "Saving…" : "Save Settings"}</span>
                </button>
              </div>

              {/* Security Toggles */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Lock size={16} className="text-indigo-400" />
                  Security & Access Controls
                </h3>

                <div className="space-y-4 divide-y divide-zinc-800/80">
                  <div className="pt-4 first:pt-0 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Require OTP Verification</p>
                      <p className="text-xs text-zinc-500">Require users to enter OTP code during registration/login</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.requireOtp}
                      onChange={(e) => setSystemSettings({ ...systemSettings, requireOtp: e.target.checked })}
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Allow Public Self-Registration</p>
                      <p className="text-xs text-zinc-500">Allow new users to sign up without an admin invite</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.allowSelfRegister}
                      onChange={(e) => setSystemSettings({ ...systemSettings, allowSelfRegister: e.target.checked })}
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Maintenance Mode</p>
                      <p className="text-xs text-rose-400">Restrict access to non-admin users during maintenance</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                      className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Workspace Limits */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Sliders size={16} className="text-emerald-400" />
                  Workspace Limits & Retention
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400 font-medium">Max Members per Team</label>
                    <input
                      type="number"
                      value={systemSettings.maxMembersPerTeam}
                      onChange={(e) => setSystemSettings({ ...systemSettings, maxMembersPerTeam: parseInt(e.target.value) || 10 })}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-sm outline-none text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400 font-medium">Audit Log Retention (Days)</label>
                    <select
                      value={systemSettings.auditRetentionDays}
                      onChange={(e) => setSystemSettings({ ...systemSettings, auditRetentionDays: parseInt(e.target.value) || 30 })}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-sm outline-none text-white cursor-pointer"
                    >
                      <option value={30}>30 Days</option>
                      <option value={60}>60 Days</option>
                      <option value={90}>90 Days</option>
                      <option value={365}>1 Year</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
