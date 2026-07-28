"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Ban,
  Download,
  Activity,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Settings,
  BarChart3,
  Calendar,
  List,
  Clock,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const AdminCharts = dynamic(() => import("@/components/admin/AdminCharts"), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center bg-zinc-900 rounded-2xl animate-pulse text-zinc-500">Loading charts...</div>
});

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

function StatCard({ label, value, icon: Icon, color, onClick, accent }) {
  const accentBorder = {
    indigo:  "border-l-indigo-500",
    emerald: "border-l-emerald-500",
    purple:  "border-l-purple-500",
    amber:   "border-l-amber-500",
  }[accent] || "border-l-zinc-700";

  const accentBg = {
    indigo:  "bg-indigo-500/10",
    emerald: "bg-emerald-500/10",
    purple:  "bg-purple-500/10",
    amber:   "bg-amber-500/10",
  }[accent] || "bg-zinc-950";

  return (
    <div
      onClick={onClick}
      className={`p-6 bg-zinc-900 border border-zinc-800/80 border-l-[3px] ${accentBorder} rounded-2xl space-y-4 hover:border-zinc-700 hover:border-l-[3px] transition-all duration-200 cursor-pointer group hover:bg-zinc-850/60`}
    >
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
        <div className={`p-2.5 rounded-xl ${accentBg} ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-3xl font-bold text-white flex items-center justify-between">
        <span>{value ?? "—"}</span>
        <span className="text-xs text-zinc-600 group-hover:text-indigo-400 font-medium transition-colors">View →</span>
      </div>
    </div>
  );
}

const formatTimeAgo = (ts) => {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

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

function TeamDetailModal({ team, meetings = [], tasks = [], recentActivity = [], onClose }) {
  const [subTab, setSubTab] = useState("members");

  if (!team) return null;

  // Filter items for this team
  const teamMembers = team.members || [];
  const teamMeetings = meetings.filter((m) => m.teamId === team.id);
  const teamTasks = tasks.filter((t) => t.teamId === team.id);
  
  // Recent activity related to this team
  // Either matching targetId is team.id, or targetId is one of the team's meetings or tasks
  const teamMeetingIds = new Set(teamMeetings.map(m => m.id));
  const teamTaskIds = new Set(teamTasks.map(t => t.id));
  const teamActivities = recentActivity.filter(
    (act) =>
      act.targetId === team.id ||
      (act.targetType === "meeting" && teamMeetingIds.has(act.targetId)) ||
      (act.targetType === "task" && teamTaskIds.has(act.targetId))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase size={18} className="text-emerald-450" />
              {team.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Team ID: {team.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl my-4 text-xs">
          <div>
            <span className="text-zinc-500 block">Created By</span>
            <span className="text-zinc-300 font-semibold">{team.owner || team.createdBy || "—"}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Created At</span>
            <span className="text-zinc-300">
              {team.createdAt ? new Date(team.createdAt).toLocaleString() : "—"}
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        {/* Workspace Activity Grid */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Team Activity</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 text-center">
              <p className="text-lg font-bold text-purple-400">{teamMeetings.length}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Meetings</p>
            </div>
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 text-center">
              <p className="text-lg font-bold text-amber-400">{teamTasks.length}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Tasks</p>
            </div>
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 text-center">
              <p className="text-lg font-bold text-emerald-400">{team.stats?.documents || 0}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Docs</p>
            </div>
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 text-center">
              <p className="text-lg font-bold text-indigo-400">{team.stats?.voiceNotes || 0}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Voice Notes</p>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto min-h-[150px] pr-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Members ({teamMembers.length})</p>
          <div className="space-y-2">
            {teamMembers.length === 0 ? (
              <div className="text-center py-10 text-zinc-550 text-xs">No members assigned to this team.</div>
            ) : (
              teamMembers.map((email) => (
                <div key={email} className="flex items-center gap-3 p-3 bg-zinc-950/30 border border-zinc-850/60 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-300 font-medium truncate">{email}</p>
                  </div>
                  {email === (team.owner || team.createdBy) && (
                    <span className="text-[10px] bg-emerald-950/40 text-emerald-450 px-2 py-0.5 rounded border border-emerald-900/30 ml-auto shrink-0">
                      Owner
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 text-xs rounded-xl border border-zinc-800 text-zinc-450 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDetailModal({ user, currentUser, onClose, onToggleBan, onChangeRole }) {
  if (!user) return null;
  const isSelf = user.email?.toLowerCase() === currentUser?.email?.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-sm font-bold text-indigo-200 shrink-0">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {user.name || user.email}
                {isSelf && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">You</span>}
              </h3>
              <p className="text-xs text-zinc-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 bg-zinc-950/40 p-4 border border-zinc-800 rounded-xl text-sm">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Role</span>
            <Badge color={user.role === "admin" ? "indigo" : "zinc"}>
              {user.role === "admin" ? "Admin" : "Member"}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Status</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              user.isBanned ? "bg-rose-950/40 text-rose-450 border border-rose-900/30" : "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
            }`}>
              {user.isBanned ? "Suspended" : "Active"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Joined</span>
            <span className="text-zinc-300">
              {user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
            </span>
          </div>
        </div>

        {user.teams && user.teams.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Assigned Teams</p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {user.teams.map((tName) => (
                <span key={tName} className="text-xs text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/50">
                  {tName}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Workspace Activity</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 text-center">
              <p className="text-lg font-bold text-indigo-400">{user.stats?.messages || 0}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Messages Sent</p>
            </div>
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 text-center">
              <p className="text-lg font-bold text-emerald-400">{user.stats?.documents || 0}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Docs Uploaded</p>
            </div>
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 text-center">
              <p className="text-lg font-bold text-amber-400">{user.stats?.voiceNotes || 0}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Voice Notes</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-800">
          {onChangeRole && (
            <button
              onClick={() => { onClose(); onChangeRole(user.email, user.role); }}
              className="flex-1 py-2 text-xs rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all font-semibold cursor-pointer"
            >
              {user.role === "admin" ? "Demote to Member" : "Promote to Admin"}
            </button>
          )}
          {onToggleBan && (
            <button
              disabled={isSelf}
              onClick={() => { onClose(); onToggleBan(user.email, user.isBanned); }}
              className={`flex-1 py-2 text-xs rounded-xl font-semibold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                user.isBanned
                  ? "border-emerald-700/60 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                  : "border-rose-700/60 text-rose-450 hover:bg-rose-600 hover:text-white"
              }`}
            >
              {user.isBanned ? "Reactivate User" : "Suspend User"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MeetingDetailModal({ meeting, onClose }) {
  if (!meeting) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-900/30 border border-purple-700/40 text-purple-400 shrink-0">
              <Video size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{meeting.title || "Untitled Meeting"}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Meeting ID: {meeting.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 bg-zinc-950/40 p-4 border border-zinc-800 rounded-xl text-sm">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Host / Scheduled By</span>
            <span className="text-zinc-200 font-semibold">{meeting.host || meeting.createdBy || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Scheduled Date</span>
            <span className="text-zinc-300">{meeting.date || "—"} at {meeting.time || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Duration</span>
            <span className="text-zinc-300">{meeting.duration ? `${meeting.duration} mins` : "—"}</span>
          </div>
          {meeting.teamId && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Workspace / Team</span>
              <span className="text-zinc-300">{meeting.teamId}</span>
            </div>
          )}
        </div>

        <button onClick={onClose} className="w-full py-2 text-sm rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer">
          Close
        </button>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, onClose }) {
  if (!task) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-900/30 border border-amber-700/40 text-amber-400 shrink-0">
              <CheckSquare size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{task.title || "Untitled Task"}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Task ID: {task.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 bg-zinc-950/40 p-4 border border-zinc-800 rounded-xl text-sm">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Assignee</span>
            <span className="text-zinc-200 font-semibold">{task.assignee || task.assigneeEmail || "Unassigned"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Status</span>
            <Badge color={task.status === "done" ? "emerald" : task.status === "in-progress" ? "amber" : "zinc"}>
              {task.status || "todo"}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Priority</span>
            <Badge color={task.priority === "high" ? "rose" : task.priority === "medium" ? "amber" : "zinc"}>
              {task.priority || "medium"}
            </Badge>
          </div>
          {task.createdBy && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Created By</span>
              <span className="text-zinc-300">{task.createdBy}</span>
            </div>
          )}
        </div>

        <button onClick={onClose} className="w-full py-2 text-sm rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer">
          Close
        </button>
      </div>
    </div>
  );
}

function MeetingsListModal({ meetings, onClose, onSelectMeeting }) {
  const [query, setQuery] = useState("");
  const filtered = (meetings || []).filter(
    (m) =>
      (m.title && m.title.toLowerCase().includes(query.toLowerCase())) ||
      (m.host && m.host.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Video size={18} className="text-purple-400" />
              All Workspace Meetings
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">{meetings?.length || 0} total meetings scheduled</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search meetings by title or host..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">No meetings found.</div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMeeting(m)}
                className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-850 hover:border-zinc-750 rounded-xl transition-all cursor-pointer group"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">{m.title}</p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">Host: {m.host} • Date: {m.date || "N/A"}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/50">
                    {m.duration ? `${m.duration} mins` : "Scheduled"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TasksListModal({ tasks, onClose, onSelectTask }) {
  const [query, setQuery] = useState("");
  const filtered = (tasks || []).filter(
    (t) =>
      (t.title && t.title.toLowerCase().includes(query.toLowerCase())) ||
      (t.assignee && t.assignee.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckSquare size={18} className="text-amber-400" />
              All Workspace Tasks
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">{tasks?.length || 0} total tasks tracked</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search tasks by title or assignee..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">No tasks found.</div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-850 hover:border-zinc-750 rounded-xl transition-all cursor-pointer group"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-amber-300 transition-colors">{t.title}</p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">Assignee: {t.assignee || "Unassigned"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge color={t.priority === "high" ? "rose" : t.priority === "medium" ? "amber" : "zinc"}>
                    {t.priority || "medium"}
                  </Badge>
                  <Badge color={t.status === "done" ? "emerald" : t.status === "in-progress" ? "amber" : "zinc"}>
                    {t.status || "todo"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BanModal({ users, currentUser, onClose, onToggleBan }) {
  const [query, setQuery] = useState("");
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Ban size={18} className="text-rose-500" />
              Suspend/Reactivate User
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Search and manage user access status</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-sm">No users found.</div>
          ) : (
            filteredUsers.map((u) => {
              const isSelf = u.email.toLowerCase() === currentUser?.email?.toLowerCase();
              return (
                <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-850 hover:border-zinc-800 rounded-xl transition-all">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                      {u.name || u.email}
                      {isSelf && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">You</span>}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      u.isBanned ? "bg-rose-950/40 text-rose-455 border border-rose-900/30" : "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                    }`}>
                      {u.isBanned ? "Suspended" : "Active"}
                    </span>
                    <button
                      disabled={isSelf}
                      onClick={() => onToggleBan(u.email, u.isBanned)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-semibold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        u.isBanned
                          ? "border-emerald-700/60 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                          : "border-rose-700/60 text-rose-455 hover:bg-rose-600 hover:text-white"
                      }`}
                    >
                      {u.isBanned ? "Reactivate" : "Suspend"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteTeamModal({ teams, onClose, onDeleteTeam }) {
  const [query, setQuery] = useState("");
  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 size={18} className="text-rose-500" />
              Delete a Team
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Search and permanently delete a team workspace</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by team name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* Teams List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
          {filteredTeams.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-sm">No teams found.</div>
          ) : (
            filteredTeams.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-850 hover:border-zinc-800 rounded-xl transition-all">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{t.members?.length || 0} members</p>
                </div>
                <button
                  onClick={() => onDeleteTeam(t.id, t.name)}
                  className="px-3 py-1.5 text-xs rounded-lg font-semibold border border-rose-700/60 text-rose-455 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                >
                  Delete Team
                </button>
              </div>
            ))
          )}
        </div>
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
  const [detailUser, setDetailUser]     = useState(null);
  const [detailMeeting, setDetailMeeting] = useState(null);
  const [detailTask, setDetailTask]     = useState(null);
  const [meetingsListOpen, setMeetingsListOpen] = useState(false);
  const [tasksListOpen, setTasksListOpen]     = useState(false);

  const [toast, setToast]               = useState(null);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banSearchQuery, setBanSearchQuery] = useState("");
  const [deleteTeamModalOpen, setDeleteTeamModalOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  // User Management: search, filter, sort, pagination
  const [userSearch, setUserSearch]           = useState("");
  const [userFilterTeam, setUserFilterTeam]   = useState("all");
  const [userFilterStatus, setUserFilterStatus] = useState("all");
  const [userSortKey, setUserSortKey]         = useState("name");
  const [userSortAsc, setUserSortAsc]         = useState(true);
  const [userPage, setUserPage]               = useState(1);
  const USERS_PER_PAGE = 10;

  // Additional state for new tabs
  const [meetingSearch, setMeetingSearch] = useState("");
  const [meetingFilterStatus, setMeetingFilterStatus] = useState("all");

  const [taskSearch, setTaskSearch] = useState("");
  const [taskFilterStatus, setTaskFilterStatus] = useState("all");

  const [activitySearch, setActivitySearch] = useState("");
  const [activityLimit, setActivityLimit] = useState(20);

  // ── FILTER, SORT & PAGINATE USERS ──
  const uniqueTeamNames = useMemo(() => {
    const names = new Set();
    users.forEach(u => {
      if (Array.isArray(u.teams)) {
        u.teams.forEach(tName => names.add(tName));
      }
    });
    return Array.from(names);
  }, [users]);

  const filteredAndSortedUsers = useMemo(() => {
    // 1. Filtering
    let result = users.filter((u) => {
      const nameMatch = u.name?.toLowerCase().includes(userSearch.toLowerCase()) || false;
      const emailMatch = u.email?.toLowerCase().includes(userSearch.toLowerCase()) || false;
      if (userSearch && !nameMatch && !emailMatch) return false;

      // Filter by Team
      if (userFilterTeam !== "all") {
        if (userFilterTeam === "none") {
          if (u.teams && u.teams.length > 0) return false;
        } else {
          if (!u.teams || !u.teams.includes(userFilterTeam)) return false;
        }
      }

      // Filter by Verification Status
      const isVerified = u.isVerified !== false; // defaults to true
      if (userFilterStatus === "verified" && !isVerified) return false;
      if (userFilterStatus === "unverified" && isVerified) return false;

      return true;
    });

    // 2. Sorting
    result.sort((a, b) => {
      let aVal = "";
      let bVal = "";

      if (userSortKey === "name") {
        aVal = a.name || a.email || "";
        bVal = b.name || b.email || "";
      } else if (userSortKey === "joined") {
        aVal = a.createdAt || 0;
        bVal = b.createdAt || 0;
      } else if (userSortKey === "team") {
        aVal = a.teams?.join(", ") || "";
        bVal = b.teams?.join(", ") || "";
      }

      if (aVal < bVal) return userSortAsc ? -1 : 1;
      if (aVal > bVal) return userSortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, userSearch, userFilterTeam, userFilterStatus, userSortKey, userSortAsc]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (userPage - 1) * USERS_PER_PAGE;
    return filteredAndSortedUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredAndSortedUsers, userPage]);

  const totalUserPages = Math.ceil(filteredAndSortedUsers.length / USERS_PER_PAGE);

  // Reset page when search or filters change
  useEffect(() => {
    setUserPage(1);
  }, [userSearch, userFilterTeam, userFilterStatus]);

  const handleActivityClick = (act) => {
    if (!act) return;
    if (act.targetType === "user" || act.type === "user") {
      const user = stats?.users?.find((u) => u.email?.toLowerCase() === act.targetId?.toLowerCase() || u.id === act.targetId) || {
        email: act.targetId || act.userName,
        name: act.userName,
        role: "member",
        createdAt: act.timestamp
      };
      setDetailUser(user);
    } else if (act.targetType === "team" || act.type === "team") {
      const team = stats?.teams?.find((t) => t.id === act.targetId) || allTeams.find((t) => t.id === act.targetId) || {
        id: act.targetId,
        name: act.userName,
        members: []
      };
      setDetailTeam(team);
    } else if (act.targetType === "meeting" || act.type === "meeting") {
      const meeting = stats?.meetings?.find((m) => m.id === act.targetId) || {
        id: act.targetId,
        title: act.action.replace("scheduled meeting ", "").replace(/"/g, ""),
        host: act.userName,
        timestamp: act.timestamp
      };
      setDetailMeeting(meeting);
    } else if (act.targetType === "task" || act.type === "task") {
      const task = stats?.tasks?.find((t) => t.id === act.targetId) || {
        id: act.targetId,
        title: act.action.replace("created task ", "").replace(/"/g, ""),
        createdBy: act.userName,
        createdAt: act.timestamp
      };
      setDetailTask(task);
    }
  };

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
    if (res.ok) { showToast(`${email} is now ${newRole}`); fetchUsers(); fetchStats(); }
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
        if (res.ok) { showToast("User removed"); fetchUsers(); fetchStats(); }
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
        if (res.ok) { showToast("Team deleted"); fetchTeams(); fetchStats(); }
        else showToast("Failed to delete team", "error");
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const handleToggleBan = (email, isCurrentlyBanned) => {
    setConfirmModal({
      title: isCurrentlyBanned ? "Reactivate User" : "Suspend User",
      message: isCurrentlyBanned
        ? `Are you sure you want to reactivate the account for ${email}?`
        : `Are you sure you want to suspend the account for ${email}? This will prevent them from logging in.`,
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggleBan", email, isBanned: !isCurrentlyBanned }),
        });
        if (res.ok) {
          showToast(isCurrentlyBanned ? "User reactivated" : "User suspended");
          fetchStats();
          fetchUsers();
        } else {
          showToast("Failed to update user status", "error");
        }
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const exportUsersToCSV = () => {
    if (!stats?.users) { showToast("No users to export", "error"); return; }
    const headers = ["Name", "Email", "Role", "Status", "Joined At"];
    const rows = stats.users.map(u => [
      u.name || "",
      u.email || "",
      u.role || "member",
      u.isBanned ? "Suspended" : "Active",
      u.createdAt ? new Date(u.createdAt).toISOString() : ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `huddlr_users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Users exported successfully");
  };

  const exportTeamsToCSV = () => {
    if (!stats?.teams) { showToast("No teams to export", "error"); return; }
    const headers = ["Team ID", "Team Name", "Members Count"];
    const rows = stats.teams.map(t => [
      t.id || "",
      t.name || "",
      t.members?.length || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `huddlr_teams_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Teams exported successfully");
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

  const getTasksData = () => {
    if (!stats?.tasks) return [];
    let todo = 0, inProgress = 0, done = 0;
    stats.tasks.forEach(t => {
      const status = t.status || "todo";
      if (status === "done") done++;
      else if (status === "in-progress") inProgress++;
      else todo++;
    });
    return [
      { name: "To Do", value: todo, color: "#f87171" },
      { name: "In Progress", value: inProgress, color: "#fbbf24" },
      { name: "Done", value: done, color: "#34d399" }
    ];
  };



  const tabs = [
    { id: "dashboard", label: "Dashboard",       icon: LayoutDashboard },
    { id: "users",     label: "User Management",  icon: Users },
    { id: "teams",     label: "Team Management",  icon: Briefcase },
    { id: "meetings",  label: "Meetings",         icon: Video },
    { id: "tasks",     label: "Tasks",            icon: CheckSquare },
    { id: "activity",  label: "Recent Activity",  icon: Activity },
    { id: "analytics", label: "Analytics",        icon: BarChart3 },
    { id: "settings",  label: "Settings",         icon: Settings }
  ];

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin text-indigo-500" />
          <span className="text-zinc-400 text-sm font-medium">Verifying admin permissions...</span>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

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
      {detailTeam && (
        <TeamDetailModal
          team={detailTeam}
          meetings={stats?.meetings || []}
          tasks={stats?.tasks || []}
          recentActivity={stats?.recentActivity || []}
          onClose={() => setDetailTeam(null)}
        />
      )}
      {detailUser && (
        <UserDetailModal
          user={detailUser}
          currentUser={currentUser}
          onClose={() => setDetailUser(null)}
          onToggleBan={handleToggleBan}
          onChangeRole={handleChangeRole}
        />
      )}
      {detailMeeting && (
        <MeetingDetailModal
          meeting={detailMeeting}
          onClose={() => setDetailMeeting(null)}
        />
      )}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
        />
      )}
      {meetingsListOpen && (
        <MeetingsListModal
          meetings={stats?.meetings || []}
          onClose={() => setMeetingsListOpen(false)}
          onSelectMeeting={(m) => {
            setMeetingsListOpen(false);
            setDetailMeeting(m);
          }}
        />
      )}
      {tasksListOpen && (
        <TasksListModal
          tasks={stats?.tasks || []}
          onClose={() => setTasksListOpen(false)}
          onSelectTask={(t) => {
            setTasksListOpen(false);
            setDetailTask(t);
          }}
        />
      )}
      {banModalOpen && (
        <BanModal
          users={stats?.users || []}
          currentUser={currentUser}
          onClose={() => setBanModalOpen(false)}
          onToggleBan={handleToggleBan}
        />
      )}
      {deleteTeamModalOpen && (
        <DeleteTeamModal
          teams={stats?.teams || []}
          onClose={() => setDeleteTeamModalOpen(false)}
          onDeleteTeam={handleDeleteTeam}
        />
      )}

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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatCard label="Total Users"    value={stats?.totalUsers}    icon={Users}       color="text-indigo-400"  accent="indigo"  onClick={() => setActiveTab("users")} />
                  <StatCard label="Total Teams"    value={stats?.totalTeams}    icon={Briefcase}   color="text-emerald-400" accent="emerald" onClick={() => setActiveTab("teams")} />
                  <StatCard label="Total Meetings" value={stats?.totalMeetings} icon={Video}       color="text-purple-400"  accent="purple"  onClick={() => setMeetingsListOpen(true)} />
                  <StatCard label="Total Tasks"    value={stats?.totalTasks}    icon={CheckSquare} color="text-amber-400"   accent="amber"   onClick={() => setTasksListOpen(true)} />
                </div>
              )}

              {/* Charts */}
              {!loadingStats && stats && (
                <AdminCharts signupsData={getSignupsData()} meetingsData={getMeetingsData()} tasksData={getTasksData()} />
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

              {/* Recent Activity & Quick Actions */}
              {!loadingStats && stats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                  {/* Recent Activity Feed */}
                  <div className="lg:col-span-2 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity size={18} className="text-indigo-400" />
                        Recent Activity
                      </h3>
                      <button
                        onClick={fetchStats}
                        disabled={loadingStats}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                        title="Refresh Activity"
                      >
                        <RefreshCw size={14} className={loadingStats ? "animate-spin" : ""} />
                      </button>
                    </div>

                    <div className="flex-1 space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {!stats.recentActivity || stats.recentActivity.length === 0 ? (
                        <div className="py-12 text-center text-zinc-500 text-sm">No activity recorded yet.</div>
                      ) : (
                        stats.recentActivity.map((act) => {
                          const iconColor = {
                            user: "bg-indigo-900/40 text-indigo-400 border border-indigo-750/30",
                            team: "bg-emerald-900/40 text-emerald-450 border border-emerald-750/30",
                            meeting: "bg-purple-900/40 text-purple-400 border border-purple-750/30",
                            task: "bg-amber-900/40 text-amber-400 border border-amber-750/30"
                          }[act.type] || "bg-zinc-900 text-zinc-450 border border-zinc-800";

                          const IconComponent = {
                            user: Users,
                            team: Briefcase,
                            meeting: Video,
                            task: CheckSquare
                          }[act.type] || Activity;

                          return (
                            <div key={act.id} onClick={() => handleActivityClick(act)} className="flex items-start gap-3 p-3 bg-zinc-950/30 border border-zinc-850/60 rounded-xl hover:border-zinc-700 hover:bg-zinc-900/60 transition-all cursor-pointer group">
                              <div className={`p-2 rounded-lg ${iconColor} shrink-0`}>
                                <IconComponent size={14} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                                  <span className="font-bold text-white">{act.userName}</span> {act.action}
                                </p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{formatTimeAgo(act.timestamp)}</p>
                              </div>
                              <span className="text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0 self-center text-xs">→</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Quick Actions Panel */}
                  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Shield size={18} className="text-emerald-400" />
                        Quick Actions
                      </h3>
                      
                      <div className="space-y-3">
                        <button
                          onClick={exportUsersToCSV}
                          className="w-full flex items-center justify-between p-3.5 bg-zinc-950/40 hover:bg-zinc-850/40 border border-zinc-850 hover:border-zinc-800 rounded-xl transition-all text-left text-sm text-zinc-300 cursor-pointer group"
                        >
                          <span className="flex items-center gap-2 font-semibold group-hover:text-white transition-colors">
                            <Download size={15} className="text-indigo-400 shrink-0" />
                            Export Users
                          </span>
                          <span className="text-[10px] bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/40 font-medium">CSV</span>
                        </button>

                        <button
                          onClick={exportTeamsToCSV}
                          className="w-full flex items-center justify-between p-3.5 bg-zinc-950/40 hover:bg-zinc-850/40 border border-zinc-850 hover:border-zinc-800 rounded-xl transition-all text-left text-sm text-zinc-300 cursor-pointer group"
                        >
                          <span className="flex items-center gap-2 font-semibold group-hover:text-white transition-colors">
                            <Download size={15} className="text-emerald-450 shrink-0" />
                            Export Teams
                          </span>
                          <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40 font-medium">CSV</span>
                        </button>

                        <button
                          onClick={() => { setBanModalOpen(true); setBanSearchQuery(""); }}
                          className="w-full flex items-center justify-between p-3.5 bg-zinc-950/40 hover:bg-zinc-850/40 border border-zinc-850 hover:border-zinc-800 rounded-xl transition-all text-left text-sm text-zinc-300 cursor-pointer group"
                        >
                          <span className="flex items-center gap-2 font-semibold group-hover:text-white transition-colors">
                            <Ban size={15} className="text-rose-455 shrink-0" />
                            Ban / Suspend User
                          </span>
                          <span className="text-[10px] bg-rose-950/30 text-rose-455 px-2 py-0.5 rounded border border-rose-800/40 font-medium">Manage</span>
                        </button>

                        <button
                          onClick={() => { setDeleteTeamModalOpen(true); setTeamSearchQuery(""); }}
                          className="w-full flex items-center justify-between p-3.5 bg-zinc-950/40 hover:bg-zinc-850/40 border border-zinc-850 hover:border-zinc-800 rounded-xl transition-all text-left text-sm text-zinc-300 cursor-pointer group"
                        >
                          <span className="flex items-center gap-2 font-semibold group-hover:text-white transition-colors">
                            <Trash2 size={15} className="text-rose-455 shrink-0" />
                            Delete a Team
                          </span>
                          <span className="text-[10px] bg-rose-950/30 text-rose-455 px-2 py-0.5 rounded border border-rose-800/40 font-medium">Delete</span>
                        </button>
                      </div>
                    </div>
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
            <div className="space-y-6 max-w-6xl">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users size={20} className="text-indigo-400" />
                    User Management
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {filteredAndSortedUsers.length} of {users.length} registered accounts
                  </p>
                </div>
                <button
                  id="admin-refresh-users"
                  onClick={fetchUsers}
                  disabled={loadingUsers}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-850 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={12} className={loadingUsers ? "animate-spin" : ""} />
                  Refresh List
                </button>
              </div>

              {/* Search & Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900/40 p-4 border border-zinc-850 rounded-2xl">
                {/* Search */}
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>

                {/* Filter by Team */}
                <div className="relative flex items-center gap-2 bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded-xl">
                  <Filter size={14} className="text-zinc-500 shrink-0" />
                  <select
                    value={userFilterTeam}
                    onChange={(e) => setUserFilterTeam(e.target.value)}
                    className="w-full bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-zinc-950">All Teams</option>
                    <option value="none" className="bg-zinc-950">No Team</option>
                    {uniqueTeamNames.map((name) => (
                      <option key={name} value={name} className="bg-zinc-950">
                        Team: {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Verification Status */}
                <div className="relative flex items-center gap-2 bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded-xl">
                  <SlidersHorizontal size={14} className="text-zinc-500 shrink-0" />
                  <select
                    value={userFilterStatus}
                    onChange={(e) => setUserFilterStatus(e.target.value)}
                    className="w-full bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-zinc-950">All Statuses</option>
                    <option value="verified" className="bg-zinc-950">Verified</option>
                    <option value="unverified" className="bg-zinc-950">Unverified</option>
                  </select>
                </div>
              </div>

              {/* Table / Results */}
              {loadingUsers ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredAndSortedUsers.length === 0 ? (
                <div className="p-16 bg-zinc-900 border border-zinc-800/80 rounded-2xl text-center space-y-3">
                  <Users size={32} className="text-zinc-650 mx-auto" />
                  <p className="text-zinc-400 text-sm font-medium">No accounts match your query</p>
                  <button
                    onClick={() => {
                      setUserSearch("");
                      setUserFilterTeam("all");
                      setUserFilterStatus("all");
                    }}
                    className="px-4 py-2 text-xs rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-semibold transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            {/* Sortable Name Column */}
                            <th
                              onClick={() => {
                                if (userSortKey === "name") setUserSortAsc(!userSortAsc);
                                else { setUserSortKey("name"); setUserSortAsc(true); }
                              }}
                              className="px-5 py-4 cursor-pointer hover:text-white hover:bg-zinc-850/40 transition-all select-none"
                            >
                              <div className="flex items-center gap-1">
                                Name
                                {userSortKey === "name" ? (
                                  userSortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-40" />
                                )}
                              </div>
                            </th>
                            <th className="px-5 py-4">Email</th>
                            <th className="px-5 py-4">Role</th>
                            {/* Sortable Team Column */}
                            <th
                              onClick={() => {
                                if (userSortKey === "team") setUserSortAsc(!userSortAsc);
                                else { setUserSortKey("team"); setUserSortAsc(true); }
                              }}
                              className="px-5 py-4 cursor-pointer hover:text-white hover:bg-zinc-850/40 transition-all select-none"
                            >
                              <div className="flex items-center gap-1">
                                Teams
                                {userSortKey === "team" ? (
                                  userSortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-40" />
                                )}
                              </div>
                            </th>
                            {/* Sortable Joined Date Column */}
                            <th
                              onClick={() => {
                                if (userSortKey === "joined") setUserSortAsc(!userSortAsc);
                                else { setUserSortKey("joined"); setUserSortAsc(true); }
                              }}
                              className="px-5 py-4 cursor-pointer hover:text-white hover:bg-zinc-850/40 transition-all select-none"
                            >
                              <div className="flex items-center gap-1">
                                Joined At
                                {userSortKey === "joined" ? (
                                  userSortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-40" />
                                )}
                              </div>
                            </th>
                            <th className="px-5 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/25">
                          {paginatedUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-zinc-850/30 transition-colors group">
                              <td className="px-5 py-4 cursor-pointer" onClick={() => setDetailUser(user)}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-200 shrink-0">
                                    {user.name?.charAt(0).toUpperCase() || "U"}
                                  </div>
                                  <span className="font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">{user.name || user.email}</span>
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
                              <td className="px-5 py-4 text-zinc-550 text-xs">
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

                  {/* Pagination Section */}
                  {totalUserPages > 1 && (
                    <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 px-5 py-4 rounded-2xl">
                      <span className="text-xs text-zinc-500 font-medium">
                        Showing page {userPage} of {totalUserPages} ({filteredAndSortedUsers.length} total users)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setUserPage(p => Math.max(p - 1, 1))}
                          disabled={userPage === 1}
                          className="p-2 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={15} />
                        </button>
                        {[...Array(totalUserPages)].map((_, index) => {
                          const pNum = index + 1;
                          return (
                            <button
                              key={pNum}
                              onClick={() => setUserPage(pNum)}
                              className={`w-8.5 h-8.5 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                                userPage === pNum
                                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                                  : "border-zinc-800 hover:bg-zinc-800 text-zinc-450 hover:text-white"
                              }`}
                            >
                              {pNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setUserPage(p => Math.min(p + 1, totalUserPages))}
                          disabled={userPage === totalUserPages}
                          className="p-2 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}
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
                            <td className="px-5 py-4 text-zinc-400 text-xs">{team.createdBy}</td>
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

          {/* ── MEETINGS TAB ── */}
          {activeTab === "meetings" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Video size={20} className="text-purple-400" />
                    All Meetings
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{stats?.meetings?.length || 0} total meetings</p>
                </div>
                <button onClick={fetchStats} disabled={loadingStats} className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer disabled:opacity-50">
                  <RefreshCw size={14} className={loadingStats ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by title or host..."
                    value={meetingSearch}
                    onChange={(e) => setMeetingSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>
                <div className="relative flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
                  <Filter size={14} className="text-zinc-500 shrink-0" />
                  <select
                    value={meetingFilterStatus}
                    onChange={(e) => setMeetingFilterStatus(e.target.value)}
                    className="w-full bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-zinc-900">All Statuses</option>
                    <option value="upcoming" className="bg-zinc-900">Upcoming</option>
                    <option value="completed" className="bg-zinc-900">Completed</option>
                  </select>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-5 py-4">Title</th>
                      <th className="px-5 py-4">Host</th>
                      <th className="px-5 py-4">Team ID</th>
                      <th className="px-5 py-4">Date / Time</th>
                      <th className="px-5 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {(stats?.meetings || [])
                      .filter(m => (m.title?.toLowerCase().includes(meetingSearch.toLowerCase()) || m.host?.toLowerCase().includes(meetingSearch.toLowerCase())))
                      .filter(m => meetingFilterStatus === "all" ? true : m.status === meetingFilterStatus)
                      .map(m => (
                        <tr key={m.id} onClick={() => setDetailMeeting(m)} className="hover:bg-zinc-850/30 transition-colors cursor-pointer group">
                          <td className="px-5 py-4 font-medium text-white group-hover:text-purple-300 transition-colors">{m.title || "Untitled"}</td>
                          <td className="px-5 py-4 text-zinc-400">{m.host}</td>
                          <td className="px-5 py-4 text-zinc-500 text-xs">{m.teamId || "—"}</td>
                          <td className="px-5 py-4 text-zinc-400 text-xs">{m.date || "—"} at {m.time || "—"}</td>
                          <td className="px-5 py-4 text-right">
                            <Badge color={m.status === "completed" ? "emerald" : "zinc"}>{m.status || "upcoming"}</Badge>
                          </td>
                        </tr>
                      ))}
                    {stats?.meetings?.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-5 py-8 text-center text-zinc-500">No meetings found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TASKS TAB ── */}
          {activeTab === "tasks" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckSquare size={20} className="text-amber-400" />
                    All Tasks
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{stats?.tasks?.length || 0} total tasks</p>
                </div>
                <button onClick={fetchStats} disabled={loadingStats} className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer disabled:opacity-50">
                  <RefreshCw size={14} className={loadingStats ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by title or assignee..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>
                <div className="relative flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
                  <Filter size={14} className="text-zinc-500 shrink-0" />
                  <select
                    value={taskFilterStatus}
                    onChange={(e) => setTaskFilterStatus(e.target.value)}
                    className="w-full bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-zinc-900">All Statuses</option>
                    <option value="todo" className="bg-zinc-900">To Do</option>
                    <option value="in-progress" className="bg-zinc-900">In Progress</option>
                    <option value="done" className="bg-zinc-900">Done</option>
                  </select>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-5 py-4">Title</th>
                      <th className="px-5 py-4">Assignee</th>
                      <th className="px-5 py-4">Team ID</th>
                      <th className="px-5 py-4">Due Date</th>
                      <th className="px-5 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {(stats?.tasks || [])
                      .filter(t => (t.title?.toLowerCase().includes(taskSearch.toLowerCase()) || t.assignee?.toLowerCase().includes(taskSearch.toLowerCase())))
                      .filter(t => taskFilterStatus === "all" ? true : (t.status || "todo") === taskFilterStatus)
                      .map(t => (
                        <tr key={t.id} onClick={() => setDetailTask(t)} className="hover:bg-zinc-850/30 transition-colors cursor-pointer group">
                          <td className="px-5 py-4 font-medium text-white group-hover:text-amber-300 transition-colors">{t.title || "Untitled"}</td>
                          <td className="px-5 py-4 text-zinc-400">{t.assignee || "Unassigned"}</td>
                          <td className="px-5 py-4 text-zinc-500 text-xs">{t.teamId || "—"}</td>
                          <td className="px-5 py-4 text-zinc-400 text-xs">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}</td>
                          <td className="px-5 py-4 text-right">
                            <Badge color={t.status === "done" ? "emerald" : t.status === "in-progress" ? "amber" : "zinc"}>{t.status || "todo"}</Badge>
                          </td>
                        </tr>
                      ))}
                    {stats?.tasks?.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-5 py-8 text-center text-zinc-500">No tasks found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── RECENT ACTIVITY TAB ── */}
          {activeTab === "activity" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity size={20} className="text-indigo-400" />
                    Global Activity Feed
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Comprehensive audit log of all workspace events</p>
                </div>
                <button onClick={fetchStats} disabled={loadingStats} className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer disabled:opacity-50">
                  <RefreshCw size={14} className={loadingStats ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              <div className="relative mb-6">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search activity by user, action, or target..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-xl">
                <div className="space-y-2">
                  {(() => {
                    const allActs = stats?.recentActivity || [];
                    const filteredActs = allActs.filter(act => 
                      act.userName?.toLowerCase().includes(activitySearch.toLowerCase()) || 
                      act.action?.toLowerCase().includes(activitySearch.toLowerCase())
                    );
                    const displayedActs = filteredActs.slice(0, activityLimit);
                    
                    if (filteredActs.length === 0) {
                      return <div className="py-12 text-center text-zinc-500 text-sm">No activity matches your search.</div>;
                    }

                    return (
                      <>
                        {displayedActs.map((act) => {
                          const iconColor = {
                            user: "bg-indigo-900/40 text-indigo-400 border border-indigo-750/30",
                            team: "bg-emerald-900/40 text-emerald-450 border border-emerald-750/30",
                            meeting: "bg-purple-900/40 text-purple-400 border border-purple-750/30",
                            task: "bg-amber-900/40 text-amber-400 border border-amber-750/30"
                          }[act.type] || "bg-zinc-800 text-zinc-400 border border-zinc-700";

                          const IconComponent = {
                            user: Users,
                            team: Briefcase,
                            meeting: Video,
                            task: CheckSquare
                          }[act.type] || Activity;

                          return (
                            <div key={act.id} onClick={() => handleActivityClick(act)} className="flex items-start gap-4 p-4 bg-zinc-950/30 border border-zinc-850/60 rounded-xl hover:border-zinc-700 hover:bg-zinc-850/50 transition-all cursor-pointer group">
                              <div className={`p-2.5 rounded-lg ${iconColor} shrink-0`}>
                                <IconComponent size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                                  <span className="font-bold text-white">{act.userName}</span> {act.action}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">{formatTimeAgo(act.timestamp)} • {new Date(act.timestamp).toLocaleString()}</p>
                              </div>
                              <span className="text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0 self-center text-sm px-2">View →</span>
                            </div>
                          );
                        })}
                        {filteredActs.length > activityLimit && (
                          <div className="pt-4 pb-2 text-center">
                            <button onClick={() => setActivityLimit(l => l + 20)} className="px-5 py-2 text-sm rounded-xl border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer">
                              Load More Activity
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab === "analytics" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-400" />
                    Analytics & Reports
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Deep dive into workspace metrics</p>
                </div>
                <button onClick={fetchStats} disabled={loadingStats} className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer disabled:opacity-50">
                  <RefreshCw size={14} className={loadingStats ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
              
              {!loadingStats && stats ? (
                <AdminCharts signupsData={getSignupsData()} meetingsData={getMeetingsData()} tasksData={getTasksData()} />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />)}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings size={20} className="text-zinc-400" />
                  Admin Settings
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">Manage your admin preferences</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white mb-4">Admin Profile</h3>
                  <div className="flex items-center gap-4 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xl font-bold text-indigo-200">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{currentUser?.name}</p>
                      <p className="text-sm text-zinc-400">{currentUser?.email}</p>
                      <Badge color="indigo">Super Admin</Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800/80">
                  <h3 className="text-sm font-bold text-white mb-4">Notifications</h3>
                  <div className="flex items-center justify-between bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-white">Email Alerts</p>
                      <p className="text-xs text-zinc-500">Receive email alerts for new admin activities</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800/80">
                  <h3 className="text-sm font-bold text-rose-500 mb-4">Danger Zone</h3>
                  <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-rose-400">Sign Out</p>
                      <p className="text-xs text-zinc-500">End your current admin session securely</p>
                    </div>
                    <button onClick={handleLogout} className="px-4 py-2 text-xs rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all cursor-pointer">
                      Log Out
                    </button>
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
