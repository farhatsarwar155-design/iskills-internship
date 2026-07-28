"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Video, 
  CheckSquare, 
  FileText, 
  Settings as SettingsIcon, 
  LogOut, 
  ChevronDown, 
  Plus, 
  Send, 
  UserPlus, 
  Users,
  Search,
  Bell,
  CheckCircle,
  Clock,
  Briefcase,
  Mic,
  Crown,
  Calendar,
  Shield
} from "lucide-react";
import Link from "next/link";
import { db, collection, addDoc, query, where, orderBy, onSnapshot } from "@/lib/firebase";
import TasksTab from "@/components/dashboard/TasksTab";
import MeetingsTab from "@/components/dashboard/MeetingsTab";
import NotificationsDropdown from "@/components/dashboard/NotificationsDropdown";
import VoiceNotesTab from "@/components/dashboard/VoiceNotesTab";
import DocumentsTab from "@/components/dashboard/DocumentsTab";
import SettingsTab from "@/components/dashboard/SettingsTab";
import ManageTeamModal from "@/components/dashboard/ManageTeamModal";

export default function Dashboard() {
  const router = useRouter();
  
  // Navigation & User State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [meetingsSubmenuOpen, setMeetingsSubmenuOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Sync tab from URL query param if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Teams & Chat State
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showManageTeamModal, setShowManageTeamModal] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [createTeamError, setCreateTeamError] = useState("");

  const messagesEndRef = useRef(null);
  const myMeetingsRef = useRef([]);

  // Load user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
      } catch (err) {
        console.error("Auth check failed", err);
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [router]);

  // Load user's teams
  useEffect(() => {
    if (!currentUser) return;
    const fetchTeams = async () => {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          setTeams(data.teams || []);
          if (data.teams && data.teams.length > 0 && !selectedTeam) {
            setSelectedTeam(data.teams[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch teams", err);
      }
    };
    fetchTeams();
  }, [currentUser]);

  // Apply theme when user preference changes
  useEffect(() => {
    if (currentUser?.theme) {
      const htmlEl = document.documentElement;
      if (currentUser.theme === "light") {
        htmlEl.classList.add("light");
      } else {
        htmlEl.classList.remove("light");
      }
    }
  }, [currentUser?.theme]);

  // Listen to messages for the selected team
  useEffect(() => {
    if (!selectedTeam) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("teamId", "==", selectedTeam.id),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort messages by timestamp just in case polling gets them slightly out of order
      msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedTeam]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load upcoming meetings for reminders
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, "meetings"), (snapshot) => {
      const myM = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.participants?.includes(currentUser.email) || data.hostId === currentUser.email) {
          myM.push({ id: docSnap.id, ...data });
        }
      });
      myMeetingsRef.current = myM;
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Check for meetings starting soon (15 mins)
  useEffect(() => {
    if (!currentUser) return;
    const checkReminders = () => {
      const now = new Date();
      myMeetingsRef.current.forEach(m => {
        if (m.status === "scheduled" && m.date && m.time) {
          const meetingTime = new Date(`${m.date}T${m.time}`);
          const diffMs = meetingTime.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          
          if (diffMins === 15 || diffMins === 14) {
            const notifKey = `reminder_${m.id}`;
            if (!localStorage.getItem(notifKey)) {
              localStorage.setItem(notifKey, "true");
              addDoc(collection(db, "notifications"), {
                userEmail: currentUser.email,
                type: "meeting",
                title: "Meeting Starting Soon",
                message: `Your meeting "${m.title}" is starting in 15 minutes.`,
                read: false,
                timestamp: Date.now(),
                linkId: m.id
              }).catch(err => console.error(err));
            }
          }
        }
      });
    };
    
    checkReminders();
    const intervalId = setInterval(checkReminders, 60000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  const handleUserUpdate = (updatedFields) => {
    setCurrentUser(prev => ({ ...prev, ...updatedFields }));
  };

  const handleTeamUpdate = (updatedTeam) => {
    setSelectedTeam(updatedTeam);
    setTeams(prevTeams => prevTeams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
  };

  const handleLeaveTeam = (teamId) => {
    const updatedTeams = teams.filter(t => t.id !== teamId);
    setTeams(updatedTeams);
    if (updatedTeams.length > 0) {
      setSelectedTeam(updatedTeams[0]);
    } else {
      setSelectedTeam(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      window.location.href = "/login";
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreateTeamError("");

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create team");
      }

      setTeams([...teams, data.team]);
      setSelectedTeam(data.team);
      setNewTeamName("");
      setShowCreateTeamModal(false);
    } catch (err) {
      setCreateTeamError(err.message);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedTeam) return;
    setInviteError("");
    setInviteSuccess("");

    try {
      const res = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam.id, email: inviteEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to invite member");
      }

      // Update members list locally
      const updatedTeams = teams.map(t => {
        if (t.id === selectedTeam.id) {
          return { ...t, members: data.members };
        }
        return t;
      });
      setTeams(updatedTeams);
      setSelectedTeam({ ...selectedTeam, members: data.members });

      setInviteSuccess(data.message);
      setInviteEmail("");
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess("");
      }, 1500);
    } catch (err) {
      setInviteError(err.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedTeam || !currentUser) return;

    try {
      const messagesRef = collection(db, "messages");
      await addDoc(messagesRef, {
        teamId: selectedTeam.id,
        text: messageInput.trim(),
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        timestamp: Date.now()
      });
      
      // Create chat notification for all other team members
      if (selectedTeam.members) {
        for (const member of selectedTeam.members) {
          if (member !== currentUser.email) {
            await addDoc(collection(db, "notifications"), {
              userEmail: member,
              type: "chat",
              title: `New Message in ${selectedTeam.name}`,
              message: `${currentUser.name || currentUser.email}: ${messageInput.trim()}`,
              read: false,
              timestamp: Date.now(),
              linkId: selectedTeam.id
            });
          }
        }
      }

      setMessageInput("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-zinc-400 text-sm">Entering Huddlr workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row font-sans">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col shrink-0">
        {/* Brand / Logo */}
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <span className="text-lg font-black text-white">H</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            Huddlr
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {(() => {
            const navItems = [
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "chat", label: "Team Chat", icon: MessageSquare },
              { 
                id: "meetings", 
                label: "Meetings", 
                icon: Video,
                subItems: [
                  { id: "meetings", label: "All & Calendar", icon: Calendar },
                  { id: "meetings-created", label: "Meetings I Created", icon: Crown },
                  { id: "meetings-joining", label: "Meetings to Join", icon: Users }
                ]
              },
              { id: "tasks", label: "Tasks", icon: CheckSquare },
              { id: "voice-notes", label: "Voice Notes", icon: Mic },
              { id: "documents", label: "Documents", icon: FileText },
              { id: "settings", label: "Settings", icon: SettingsIcon },
            ];

            if (currentUser?.role === "admin") {
              navItems.push({ id: "admin", label: "Admin Panel", icon: Shield, isExternal: true, href: "/admin" });
            }

            return navItems.map((item) => {
              const Icon = item.icon;
              const isSubActive = item.subItems?.some(sub => activeTab === sub.id);
              const isActive = activeTab === item.id || isSubActive;

              if (item.isExternal) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-205 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <Icon size={18} className="text-indigo-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              }

              if (item.subItems) {
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => {
                        setMeetingsSubmenuOpen(!meetingsSubmenuOpen);
                        if (activeTab !== "meetings" && !isSubActive) {
                          setActiveTab("meetings");
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" 
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${meetingsSubmenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {meetingsSubmenuOpen && (
                      <div className="pl-4 space-y-1">
                        {item.subItems.map(sub => {
                          const SubIcon = sub.icon;
                          const isThisSubActive = activeTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => setActiveTab(sub.id)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isThisSubActive
                                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                              }`}
                            >
                              <SubIcon size={14} />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            });
          })()}
        </nav>

        {/* Footer (User info & Quick logout) */}
        <div className="p-4 border-t border-zinc-800 flex flex-col gap-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 transition-all duration-200 cursor-pointer"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0 relative z-20">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white capitalize">{activeTab.replace("-", " ")}</h2>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-4">
            <NotificationsDropdown currentUser={currentUser} />
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 hover:bg-zinc-800 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                id="profile-dropdown-btn"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-sm font-bold text-indigo-200 shrink-0">
                  {currentUser?.profilePicture ? (
                    <img src={currentUser.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-zinc-300">{currentUser?.name}</span>
                <ChevronDown size={14} className="text-zinc-500" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-zinc-800">
                    <p className="text-xs text-zinc-500">Signed in as</p>
                    <p className="text-sm font-medium text-zinc-200 truncate">{currentUser?.email}</p>
                  </div>
                  <button 
                    onClick={() => { setActiveTab("settings"); setShowProfileDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                  >
                    My Settings
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-950/20 transition-all"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Tab Views */}
        <main className="flex-1 overflow-y-auto bg-zinc-950">
          
          {/* TAB: DASHBOARD (OVERVIEW) */}
          {activeTab === "dashboard" && (
            <div className="p-6 space-y-6">
              {/* Hero Banner */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-900/30 via-zinc-900 to-zinc-900 border border-indigo-500/10 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/15 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="relative z-10 space-y-2">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                    Welcome back, {currentUser?.name || "Collaborator"}!
                  </h3>
                  <p className="text-zinc-400 text-sm max-w-xl">
                    Here's a quick overview of what's happening in your Huddlr workspace today. Create a team in Team Chat to start collaborating.
                  </p>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: "Active Teams", value: teams.length, change: "Updated live", icon: Users, color: "text-purple-400", border: "border-l-purple-500", bg: "bg-purple-500/10" },
                  { label: "Unread Messages", value: "0", change: "None yet", icon: MessageSquare, color: "text-blue-400", border: "border-l-blue-500", bg: "bg-blue-500/10" },
                  { label: "Tasks Pending", value: "3", change: "2 due today", icon: CheckSquare, color: "text-orange-400", border: "border-l-orange-500", bg: "bg-orange-500/10" },
                  { label: "Meetings Today", value: "1", change: "Starts at 2:00 PM", icon: Video, color: "text-green-400", border: "border-l-green-500", bg: "bg-green-500/10" },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className={`p-6 bg-zinc-900 border border-zinc-800/80 border-l-[3px] ${stat.border} rounded-2xl space-y-4 hover:border-zinc-700/80 hover:border-l-[3px] transition-all duration-200`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-550">{stat.label}</span>
                        <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                          <Icon size={18} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-xs text-zinc-500">{stat.change}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1 & 2: Recent Activity */}
                <div className="lg:col-span-2 p-6 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Workspace Activity</h4>
                  <div className="space-y-4">
                    {[
                      { icon: Users, text: `You joined Huddlr workspace`, time: "Just now", color: "text-indigo-400" },
                      { icon: CheckSquare, text: `Task "Design Login Form" marked complete`, time: "2 hours ago", color: "text-emerald-400" },
                      { icon: MessageSquare, text: `System set up successfully`, time: "Today", color: "text-indigo-400" },
                    ].map((act, i) => {
                      const Icon = act.icon;
                      return (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon size={14} className={act.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-300">{act.text}</p>
                            <span className="text-xs text-zinc-500">{act.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Upcoming Meetings */}
                <div className="p-6 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Scheduled Meetings</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-zinc-200">Daily Standup</p>
                        <p className="text-xs text-zinc-500">2:00 PM - 2:15 PM</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">Upcoming</span>
                    </div>
                    <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-900/50 flex items-center justify-between opacity-50">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-zinc-300">Sprint Planning</p>
                        <p className="text-xs text-zinc-500">Yesterday</p>
                      </div>
                      <span className="px-2.5 py-1 bg-zinc-800 text-zinc-500 rounded-full text-xs font-medium">Finished</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TEAM CHAT */}
          {activeTab === "chat" && (
            <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
              {/* Teams List Sidebar inside Chat */}
              <div className="w-64 bg-zinc-900 border-r border-zinc-800/80 flex flex-col shrink-0">
                <div className="p-4 border-b border-zinc-800/80 flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">My Teams</span>
                  <button 
                    onClick={() => setShowCreateTeamModal(true)}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                    id="create-team-btn"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Teams List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {teams.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">No teams joined yet. Create one!</div>
                  ) : (
                    teams.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTeam(t)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                          selectedTeam?.id === t.id 
                            ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-200" 
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white border border-transparent"
                        }`}
                        id={`team-item-${t.name}`}
                      >
                        <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{t.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Conversation Column */}
              <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
                {selectedTeam ? (
                  <>
                    {/* Chat Header */}
                    <div className="h-14 border-b border-zinc-800 bg-zinc-900/20 px-6 flex items-center justify-between shrink-0">
                      <div>
                        <h3 className="font-bold text-white text-base">{selectedTeam.name}</h3>
                        <p className="text-xs text-zinc-500">
                          {selectedTeam.members?.length || 1} members &bull; Owner: {selectedTeam.owner}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const memberRoles = selectedTeam.memberRoles || {};
                          const userRole = memberRoles[currentUser?.email] || (selectedTeam.owner === currentUser?.email ? "owner" : "member");
                          if (userRole === "owner" || userRole === "co-lead") {
                            return (
                              <button
                                onClick={() => setShowManageTeamModal(true)}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-zinc-700/50"
                                id="manage-team-btn"
                              >
                                <Shield size={14} className="text-indigo-400" />
                                <span>Manage Team</span>
                              </button>
                            );
                          }
                          return null;
                        })()}
                        <button 
                          onClick={() => setShowInviteModal(true)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                          id="invite-member-btn"
                        >
                          <UserPlus size={14} />
                          <span>Invite</span>
                        </button>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-1">
                          <MessageSquare size={32} className="text-zinc-600" />
                          <p className="text-sm">No messages yet in this team.</p>
                          <p className="text-xs text-zinc-600">Send a greeting message below!</p>
                        </div>
                      ) : (
                        messages.map((m, i) => {
                          const isOwn = m.senderEmail === currentUser?.email;
                          return (
                            <div key={m.id || i} className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                              {/* Avatar */}
                              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                                isOwn ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300"
                              }`}>
                                {m.senderName ? m.senderName.charAt(0).toUpperCase() : "U"}
                              </div>
                              {/* Bubble */}
                              <div className="flex flex-col max-w-[70%] space-y-1">
                                <div className={`flex items-center gap-2 text-xs text-zinc-500 ${isOwn ? "justify-end" : ""}`}>
                                  <span className="font-semibold text-zinc-400">{m.senderName}</span>
                                  <span>&bull;</span>
                                  <span>{m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                                </div>
                                <div className={`p-3 rounded-2xl text-sm break-words ${
                                  isOwn 
                                    ? "bg-indigo-600 text-white rounded-tr-none" 
                                    : "bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800/50"
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

                    {/* Chat Input Footer */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800/80 bg-zinc-900/10">
                      <div className="flex gap-2">
                        <input
                          id="chat-input"
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder={`Message #${selectedTeam.name}`}
                          className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder-zinc-500 outline-none transition-all text-white"
                        />
                        <button
                          id="send-message-btn"
                          type="submit"
                          className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shadow-indigo-600/15 cursor-pointer flex items-center justify-center shrink-0"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400">
                      <Users size={32} />
                    </div>
                    <h3 className="font-bold text-white text-lg">No Team Selected</h3>
                    <p className="text-sm text-zinc-500 max-w-sm text-center">
                      Select an existing team from the sidebar, or create a new one to start collaborating with teammates in real-time.
                    </p>
                    <button 
                      onClick={() => setShowCreateTeamModal(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                    >
                      Create Team
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: MEETINGS (ALL, CREATED, JOINING) */}
          {(activeTab === "meetings" || activeTab === "meetings-created" || activeTab === "meetings-joining") && (
            <MeetingsTab 
              selectedTeam={selectedTeam} 
              currentUser={currentUser} 
              initialViewMode={activeTab === "meetings-created" ? "created" : activeTab === "meetings-joining" ? "joining" : "all"}
            />
          )}

          {/* TAB: TASKS */}
          {activeTab === "tasks" && (
            <TasksTab selectedTeam={selectedTeam} currentUser={currentUser} />
          )}

          {/* TAB: VOICE NOTES */}
          {activeTab === "voice-notes" && (
            <VoiceNotesTab selectedTeam={selectedTeam} currentUser={currentUser} />
          )}

          {/* TAB: DOCUMENTS */}
          {activeTab === "documents" && (
            <DocumentsTab selectedTeam={selectedTeam} currentUser={currentUser} />
          )}

          {/* TAB: SETTINGS */}
          {activeTab === "settings" && (
            <div className="p-6 space-y-6 max-w-5xl">
              <SettingsTab 
                currentUser={currentUser} 
                onUserUpdate={handleUserUpdate} 
                selectedTeam={selectedTeam} 
                onTeamUpdate={handleTeamUpdate} 
                onLeaveTeam={handleLeaveTeam} 
              />
            </div>
          )}

        </main>
      </div>

      {/* CREATE TEAM MODAL */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-850 rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">Create a New Team</h3>
            
            {createTeamError && (
              <div className="p-3 mb-4 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-200 text-xs">
                {createTeamError}
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="teamName">
                  Team Name
                </label>
                <input
                  id="teamName"
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Frontend Engineering"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder-zinc-650 outline-none text-white"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateTeamModal(false); setCreateTeamError(""); }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-create-team"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-850 rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-2">Invite to {selectedTeam.name}</h3>
            <p className="text-xs text-zinc-500 mb-4">Enter the email address of the team member you'd like to invite.</p>

            {inviteError && (
              <div className="p-3 mb-4 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-200 text-xs">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="p-3 mb-4 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-200 text-xs">
                {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="inviteEmail">
                  Teammate Email
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder-zinc-650 outline-none text-white"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setInviteError(""); setInviteSuccess(""); }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-invite-member"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE TEAM MODAL */}
      {showManageTeamModal && selectedTeam && currentUser && (
        <ManageTeamModal
          selectedTeam={selectedTeam}
          currentUser={currentUser}
          onClose={() => setShowManageTeamModal(false)}
          onTeamUpdate={handleTeamUpdate}
        />
      )}

    </div>
  );
}
