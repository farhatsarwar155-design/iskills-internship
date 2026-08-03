"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  LayoutDashboard, MessageSquare, Video, CheckSquare, FileText,
  Users, LogOut, Mic, ArrowLeft, Send, Clock, Calendar, Crown,
  UserPlus, Shield, ChevronRight, CheckCircle, AlertTriangle,
  Briefcase, Plus, Hash, TrendingUp
} from "lucide-react";
import Link from "next/link";

// ── Helper Components ────────────────────────────────────────────────────────────

function Badge({ children, color = "indigo" }) {
  const colorMap = {
    indigo: "bg-indigo-900/60 text-indigo-300 border border-indigo-700/40",
    emerald: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40",
    amber: "bg-amber-900/60 text-amber-300 border border-amber-700/40",
    rose: "bg-rose-900/60 text-rose-300 border border-rose-700/40",
    purple: "bg-purple-900/60 text-purple-300 border border-purple-700/40",
    zinc: "bg-zinc-800 text-zinc-300 border border-zinc-700/40",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorMap[color] || colorMap.indigo}`}>
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "indigo" }) {
  const colorMap = {
    indigo: "bg-indigo-600/20 text-indigo-400",
    emerald: "bg-emerald-600/20 text-emerald-400",
    amber: "bg-amber-600/20 text-amber-400",
    rose: "bg-rose-600/20 text-rose-400",
    purple: "bg-purple-600/20 text-purple-400",
  };
  return (
    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4 hover:border-zinc-700 transition-all duration-200">
      <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.indigo}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
        {sub && <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(typeof ts === "number" ? ts : ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(typeof ts === "number" ? ts : ts);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function timeAgo(ts) {
  if (!ts) return "—";
  const now = Date.now();
  const t = new Date(typeof ts === "number" ? ts : ts).getTime();
  const diff = now - t;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// ── Main Component ──────────────────────────────────────────────────────────────

export default function TeamDashboard() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId;

  const [activeTab, setActiveTab] = useState("overview");
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [teamData, setTeamData] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);

  // ── Auth Check ──
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) { router.push("/login"); return; }
        const data = await res.json();
        setCurrentUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    checkAuth();
  }, [router]);

  // ── Load Team Data ──
  useEffect(() => {
    if (!currentUser || !teamId) return;
    const fetchTeamData = async () => {
      setLoadingData(true);
      try {
        const res = await fetch(`/api/teams/${teamId}/stats`);
        if (res.status === 403) {
          setAccessDenied(true);
          return;
        }
        if (!res.ok) {
          router.push("/dashboard");
          return;
        }
        const data = await res.json();
        setTeamData(data.team);
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
      } catch (err) {
        console.error("Failed to load team data", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchTeamData();
  }, [currentUser, teamId, router]);

  // ── Load Messages (for chat tab) ──
  useEffect(() => {
    if (!teamId || activeTab !== "chat") return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/mock/db?collection=messages&teamId=${teamId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.docs || []);
        }
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [teamId, activeTab]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send Message ──
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentUser || !teamId) return;
    try {
      await fetch("/api/mock/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addDoc",
          collection: "messages",
          data: {
            teamId,
            text: messageInput.trim(),
            senderName: currentUser.name,
            senderEmail: currentUser.email,
            timestamp: Date.now(),
          },
        }),
      });
      setMessageInput("");
      // Refresh
      const res = await fetch(`/api/mock/db?collection=messages&teamId=${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.docs || []);
      }
    } catch (err) {
      console.error("Send message error", err);
    }
  };

  // ── Tab Definitions ──
  const tabs = [
    { id: "overview",    label: "Overview",    icon: LayoutDashboard },
    { id: "chat",        label: "Team Chat",   icon: MessageSquare },
    { id: "meetings",    label: "Meetings",    icon: Video },
    { id: "tasks",       label: "Tasks",       icon: CheckSquare },
    { id: "documents",   label: "Documents",   icon: FileText },
    { id: "voice-notes", label: "Voice Notes", icon: Mic },
    { id: "members",     label: "Members",     icon: Users },
  ];

  // ── Loading State ──
  if (loadingUser || loadingData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm font-medium">Loading team dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Access Denied ──
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4 p-8 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md">
          <div className="w-14 h-14 bg-rose-600/20 rounded-2xl flex items-center justify-center mx-auto">
            <Shield size={28} className="text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-sm text-zinc-400">You are not a member of this team.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all">
            <ArrowLeft size={16} />
            Back to Workspace
          </Link>
        </div>
      </div>
    );
  }

  // ── Activity Badge Colors ──
  const activityColors = {
    meeting: "bg-purple-900/60 text-purple-300 border border-purple-700/40",
    task: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40",
    document: "bg-amber-900/60 text-amber-300 border border-amber-700/40",
    message: "bg-indigo-900/60 text-indigo-300 border border-indigo-700/40",
  };

  const activityIcons = {
    meeting: Video,
    task: CheckSquare,
    document: FileText,
    message: MessageSquare,
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      {/* ─── Sidebar ─── */}
      <aside className="w-full md:w-64 bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col shrink-0">
        {/* Team Brand */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-lg font-black text-white">
              {teamData?.name?.charAt(0)?.toUpperCase() || "T"}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate leading-none">
                {teamData?.name || "Team"}
              </h2>
              <p className="text-[11px] text-indigo-400 mt-0.5 font-medium">
                {stats?.memberCount || 0} members
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
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
        <div className="p-4 border-t border-zinc-800 space-y-2">
          <Link
            href="/dashboard"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all duration-200"
          >
            <ArrowLeft size={16} />
            <span>Back to Workspace</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/60 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-indigo-600/40 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-200">
              {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{currentUser?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-600/20 rounded-lg">
              {(() => { const TabIcon = tabs.find(t => t.id === activeTab)?.icon || LayoutDashboard; return <TabIcon size={15} className="text-indigo-400" />; })()}
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block">
                {teamData?.name} — Team Dashboard
              </p>
            </div>
          </div>
          <Badge color="indigo">{teamData?.owner === currentUser?.email ? "Owner" : "Member"}</Badge>
        </header>

        <main className="flex-1 overflow-y-auto bg-zinc-950 p-6">

          {/* ══════════════ OVERVIEW TAB ══════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-5xl">
              {/* Hero */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-900/30 via-zinc-900 to-zinc-900 border border-indigo-500/10 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-lg shadow-indigo-600/20">
                      {teamData?.name?.charAt(0)?.toUpperCase() || "T"}
                    </div>
                    <div>
                      <Badge color="indigo">Team Dashboard</Badge>
                    </div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2">{teamData?.name}</h2>
                  {teamData?.description && (
                    <p className="text-zinc-400 text-sm max-w-xl mt-1">{teamData.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Crown size={13} className="text-amber-400" />
                      Owner: <span className="text-zinc-300 font-medium">{teamData?.owner}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={13} className="text-indigo-400" />
                      {stats?.memberCount} members
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-emerald-400" />
                      Created {formatDate(teamData?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={Video} label="Total Meetings" value={stats?.totalMeetings || 0} color="purple" />
                <StatCard icon={Calendar} label="Upcoming" value={stats?.upcomingMeetings || 0} color="indigo" />
                <StatCard icon={CheckSquare} label="Total Tasks" value={stats?.totalTasks || 0} sub={`${stats?.pendingTasks || 0} pending · ${stats?.doneTasks || 0} done`} color="emerald" />
                <StatCard icon={FileText} label="Documents" value={stats?.totalDocuments || 0} color="amber" />
                <StatCard icon={Mic} label="Voice Notes" value={stats?.totalVoiceNotes || 0} color="rose" />
              </div>

              {/* Quick Access + Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Access Cards */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Quick Access</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { tab: "chat", label: "Team Chat", icon: MessageSquare, color: "from-indigo-600/20 to-indigo-600/5", iconColor: "text-indigo-400", desc: `${stats?.totalMessages || 0} messages` },
                      { tab: "meetings", label: "Meetings", icon: Video, color: "from-purple-600/20 to-purple-600/5", iconColor: "text-purple-400", desc: `${stats?.totalMeetings || 0} total` },
                      { tab: "tasks", label: "Tasks", icon: CheckSquare, color: "from-emerald-600/20 to-emerald-600/5", iconColor: "text-emerald-400", desc: `${stats?.pendingTasks || 0} pending` },
                      { tab: "documents", label: "Documents", icon: FileText, color: "from-amber-600/20 to-amber-600/5", iconColor: "text-amber-400", desc: `${stats?.totalDocuments || 0} files` },
                    ].map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.tab}
                          onClick={() => setActiveTab(item.tab)}
                          className={`p-4 bg-gradient-to-br ${item.color} border border-zinc-800 rounded-2xl text-left hover:border-zinc-700 transition-all duration-200 cursor-pointer group`}
                        >
                          <ItemIcon size={22} className={`${item.iconColor} mb-2 group-hover:scale-110 transition-transform`} />
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</p>
                          <ChevronRight size={14} className="text-zinc-600 mt-2 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Recent Activity</h3>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp size={28} className="text-zinc-700 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">No activity yet</p>
                        <p className="text-xs text-zinc-600">Team events will appear here</p>
                      </div>
                    ) : (
                      recentActivity.map((event) => {
                        const EventIcon = activityIcons[event.type] || MessageSquare;
                        return (
                          <div key={event.id} className="flex items-center gap-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/50 hover:border-zinc-750 transition-all">
                            <div className={`p-2 rounded-lg ${activityColors[event.type] || activityColors.message}`}>
                              <EventIcon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white font-medium truncate">{event.title}</p>
                              <p className="text-[11px] text-zinc-500 truncate">by {event.user}</p>
                            </div>
                            <span className="text-[11px] text-zinc-600 shrink-0 flex items-center gap-1">
                              <Clock size={11} />
                              {timeAgo(event.time)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ CHAT TAB ══════════════ */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare size={40} className="text-zinc-700 mb-3" />
                    <p className="text-zinc-400 font-medium">No messages yet in #{teamData?.name}</p>
                    <p className="text-xs text-zinc-600 mt-1">Start the conversation by sending a message below!</p>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const isOwn = m.senderEmail === currentUser?.email;
                    const prevM = messages[i - 1];
                    const isSameSender = prevM && prevM.senderEmail === m.senderEmail;
                    const isCloseInTime = prevM && m.timestamp && prevM.timestamp && (new Date(m.timestamp).getTime() - new Date(prevM.timestamp).getTime() < 5 * 60 * 1000);
                    const isConsecutive = isSameSender && isCloseInTime;

                    return (
                      <div key={m.id || i} className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""} ${isConsecutive ? "mt-1" : "mt-4"}`}>
                        {!isConsecutive ? (
                          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isOwn ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-200"}`}>
                            {m.senderName ? m.senderName.charAt(0).toUpperCase() : "U"}
                          </div>
                        ) : <div className="w-8 shrink-0" />}
                        <div className={`flex flex-col max-w-[70%] space-y-1 ${isOwn ? "items-end" : "items-start"}`}>
                          {!isConsecutive && (
                            <div className={`flex items-center gap-2 text-xs px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                              <span className="font-semibold text-zinc-300">{m.senderName}</span>
                              <span className="text-[11px] text-zinc-500 font-mono">{formatTime(m.timestamp)}</span>
                            </div>
                          )}
                          <div className={`px-4 py-2.5 text-sm break-words leading-relaxed shadow-md ${
                            isOwn
                              ? "bg-indigo-600 text-white border border-indigo-500/30 rounded-2xl rounded-tr-md"
                              : "bg-zinc-900 text-zinc-100 border border-zinc-800/80 rounded-2xl rounded-tl-md"
                          }`}>
                            {m.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={`Message #${teamData?.name || "team"}...`}
                  className="flex-1 px-5 py-3.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl text-sm outline-none text-white placeholder:text-zinc-600 transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="p-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════ MEETINGS TAB ══════════════ */}
          {activeTab === "meetings" && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Team Meetings</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">All meetings for {teamData?.name}</p>
                </div>
                <Badge color="purple">{stats?.totalMeetings || 0} Total</Badge>
              </div>

              {stats?.totalMeetings === 0 ? (
                <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <Video size={40} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 font-medium">No meetings yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Schedule a meeting from the Workspace Dashboard</p>
                </div>
              ) : (
                <MeetingsList teamId={teamId} />
              )}
            </div>
          )}

          {/* ══════════════ TASKS TAB ══════════════ */}
          {activeTab === "tasks" && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Team Tasks</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{stats?.pendingTasks || 0} pending · {stats?.doneTasks || 0} done</p>
                </div>
                <Badge color="emerald">{stats?.totalTasks || 0} Total</Badge>
              </div>

              {stats?.totalTasks === 0 ? (
                <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <CheckSquare size={40} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 font-medium">No tasks yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Create tasks from the Workspace Dashboard</p>
                </div>
              ) : (
                <TasksList teamId={teamId} />
              )}
            </div>
          )}

          {/* ══════════════ DOCUMENTS TAB ══════════════ */}
          {activeTab === "documents" && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Team Documents</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Files shared in {teamData?.name}</p>
                </div>
                <Badge color="amber">{stats?.totalDocuments || 0} Files</Badge>
              </div>

              {stats?.totalDocuments === 0 ? (
                <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <FileText size={40} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 font-medium">No documents yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Upload documents from the Workspace Dashboard</p>
                </div>
              ) : (
                <DocumentsList teamId={teamId} />
              )}
            </div>
          )}

          {/* ══════════════ VOICE NOTES TAB ══════════════ */}
          {activeTab === "voice-notes" && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Voice Notes</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Audio notes for {teamData?.name}</p>
                </div>
                <Badge color="rose">{stats?.totalVoiceNotes || 0} Notes</Badge>
              </div>

              {stats?.totalVoiceNotes === 0 ? (
                <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <Mic size={40} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 font-medium">No voice notes yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Record voice notes from the Workspace Dashboard</p>
                </div>
              ) : (
                <VoiceNotesList teamId={teamId} />
              )}
            </div>
          )}

          {/* ══════════════ MEMBERS TAB ══════════════ */}
          {activeTab === "members" && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Team Members</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{teamData?.members?.length || 0} people in {teamData?.name}</p>
                </div>
                <Badge color="indigo">{teamData?.members?.length || 0} Members</Badge>
              </div>

              <div className="space-y-3">
                {teamData?.members?.map((email, idx) => {
                  const isOwner = email === teamData?.owner;
                  return (
                    <div key={email} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          isOwner
                            ? "bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/20"
                            : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                        }`}>
                          {email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{email}</p>
                          <p className="text-[11px] text-zinc-500">Joined team</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <Badge color="amber">
                            <span className="flex items-center gap-1"><Crown size={11} /> Owner</span>
                          </Badge>
                        ) : (
                          <Badge color="zinc">Member</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ── Sub-components for data tabs ─────────────────────────────────────────────────

function MeetingsList({ teamId }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await fetch(`/api/mock/db?collection=meetings&teamId=${teamId}`);
        if (res.ok) {
          const data = await res.json();
          setMeetings(data.docs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, [teamId]);

  if (loading) return <div className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-3">
      {meetings.map((m) => (
        <div key={m.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-600/20 rounded-xl text-purple-400">
                <Video size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{m.title}</h4>
                <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                  <Calendar size={12} /> {formatDate(m.date)}
                  {m.time && <><Clock size={12} className="ml-1" /> {m.time}</>}
                </p>
              </div>
            </div>
            <Badge color={m.status === "completed" ? "emerald" : "purple"}>
              {m.status || "Scheduled"}
            </Badge>
          </div>
          {m.description && <p className="text-xs text-zinc-400 mt-3 pl-12">{m.description}</p>}
        </div>
      ))}
    </div>
  );
}

function TasksList({ teamId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`/api/mock/db?collection=tasks&teamId=${teamId}`);
        if (res.ok) {
          const data = await res.json();
          setTasks(data.docs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [teamId]);

  if (loading) return <div className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />;

  const priorityColors = { high: "rose", medium: "amber", low: "emerald" };
  const statusColors = { pending: "amber", "in-progress": "indigo", done: "emerald", completed: "emerald" };

  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <div key={t.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600/20 rounded-xl text-emerald-400">
                <CheckSquare size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{t.title}</h4>
                <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                  {t.assigneeEmail && <><Users size={12} /> {t.assigneeEmail}</>}
                  {t.dueDate && <><Calendar size={12} className="ml-1" /> Due {formatDate(t.dueDate)}</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {t.priority && <Badge color={priorityColors[t.priority] || "zinc"}>{t.priority}</Badge>}
              <Badge color={statusColors[t.status] || "zinc"}>{t.status || "pending"}</Badge>
            </div>
          </div>
          {t.description && <p className="text-xs text-zinc-400 mt-3 pl-12">{t.description}</p>}
        </div>
      ))}
    </div>
  );
}

function DocumentsList({ teamId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(`/api/mock/db?collection=documents&teamId=${teamId}`);
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.docs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [teamId]);

  if (loading) return <div className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {documents.map((d, i) => (
        <div key={d.id || i} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/20 rounded-xl text-amber-400">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{d.name}</h4>
              <p className="text-xs text-zinc-500 mt-0.5">{d.type || "File"} {d.size ? `· ${(d.size / 1024).toFixed(1)} KB` : ""}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VoiceNotesList({ teamId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/mock/db?collection=voiceNotes&teamId=${teamId}`);
        if (res.ok) {
          const data = await res.json();
          setNotes(data.docs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [teamId]);

  if (loading) return <div className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-3">
      {notes.map((n, i) => (
        <div key={n.id || i} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/20 rounded-xl text-rose-400">
              <Mic size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{n.title || n.name || "Voice Note"}</h4>
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                {n.duration && <><Clock size={12} /> {n.duration}s</>}
                {n.createdAt && <span>{formatDate(n.createdAt)}</span>}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
