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

export default function Dashboard() {
  const router = useRouter();
  
  // Navigation & User State
    // Tab state for Chat / Overview
    const [activeTab, setActiveTab] = useState('chat');
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
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [createTeamError, setCreateTeamError] = useState("");

  // Manage Team State
  const [showManageTeamModal, setShowManageTeamModal] = useState(false);
  const [manageTeamName, setManageTeamName] = useState("");
  const [manageError, setManageError] = useState("");
  const [manageSuccess, setManageSuccess] = useState("");

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

  const handleRenameTeam = async (e) => {
    e.preventDefault();
    if (!manageTeamName.trim() || !selectedTeam) return;
    setManageError("");
    setManageSuccess("");
    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam.id, name: manageTeamName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename team");
      
      const updatedName = manageTeamName.trim();
      setSelectedTeam(prev => ({ ...prev, name: updatedName }));
      setTeams(prev => prev.map(t => t.id === selectedTeam.id ? { ...t, name: updatedName } : t));
      setManageSuccess("Team renamed successfully!");
    } catch (err) {
      setManageError(err.message);
    }
  };

  const handleRemoveTeamMember = async (memberEmail) => {
    if (!selectedTeam) return;
    setManageError("");
    setManageSuccess("");
    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam.id, memberToRemove: memberEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");
      
      const updatedMembers = data.members || selectedTeam.members.filter(m => m !== memberEmail);
      setSelectedTeam(prev => ({ ...prev, members: updatedMembers }));
      setTeams(prev => prev.map(t => t.id === selectedTeam.id ? { ...t, members: updatedMembers } : t));
      setManageSuccess(`Removed ${memberEmail} from team.`);
    } catch (err) {
      setManageError(err.message);
    }
  };

  const handleDeleteTeamByOwner = async () => {
    if (!selectedTeam) return;
    if (!confirm(`Are you sure you want to delete "${selectedTeam.name}"? This action cannot be undone.`)) return;
    try {
      await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteTeam", teamId: selectedTeam.id })
      });
      const updatedTeams = teams.filter(t => t.id !== selectedTeam.id);
      setTeams(updatedTeams);
      setSelectedTeam(updatedTeams.length > 0 ? updatedTeams[0] : null);
      setShowManageTeamModal(false);
    } catch (err) {
      setManageError("Failed to delete team");
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
    <div className="h-screen w-full bg-zinc-950 text-white flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 md:h-screen bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col shrink-0 z-30">
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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

            return navItems.map((item) => {
              const Icon = item.icon;
              const isSubActive = item.subItems?.some(sub => activeTab === sub.id);
              const isActive = activeTab === item.id || isSubActive;

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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Active Teams", value: teams.length, change: "Updated live", icon: Users, color: "text-indigo-400" },
                  { label: "Unread Messages", value: "0", change: "None yet", icon: MessageSquare, color: "text-emerald-400" },
                  { label: "Tasks Pending", value: "3", change: "2 due today", icon: CheckSquare, color: "text-amber-400" },
                  { label: "Meetings Today", value: "1", change: "Starts at 2:00 PM", icon: Video, color: "text-purple-400" },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="p-6 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-4 hover:border-zinc-700/80 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{stat.label}</span>
                        <div className={`p-2 bg-zinc-950 rounded-lg ${stat.color}`}>
                          <Icon size={16} />
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
            <div className="h-full flex-1 flex overflow-hidden">
              {/* Teams List Sidebar inside Chat */}
              <div className="w-64 bg-zinc-900/90 border-r border-zinc-800/80 flex flex-col shrink-0">
                <div className="p-4 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/30">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">My Teams</span>
                  <button 
                    onClick={() => setShowCreateTeamModal(true)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                    id="create-team-btn"
                    title="Create Team"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Teams List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {teams.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">No teams joined yet. Create one!</div>
                  ) : (
                    teams.map((t) => {
                      const isSelected = selectedTeam?.id === t.id;
                      return (
                        <div key={t.id} className="relative group/team-item">
                          <button
                            onClick={() => setSelectedTeam(t)}
                            className={`w-full text-left pl-3.5 pr-10 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-2.5 cursor-pointer border ${
                              isSelected 
                                ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-200 font-semibold shadow-sm" 
                                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white border-transparent hover:border-zinc-800/80"
                            }`}
                            id={`team-item-${t.name}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                isSelected
                                  ? "bg-indigo-600 text-white shadow-sm"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                              }`}>
                                {t.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate">{t.name}</span>
                            </div>
                            {t.unreadCount > 0 && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full shadow-sm shrink-0">
                                {t.unreadCount}
                              </span>
                            )}
                          </button>
                          
                          <Link
                            href={`/team/${t.id}/dashboard`}
                            title="Open Team Dashboard"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 hover:bg-indigo-600 text-zinc-400 hover:text-white rounded-lg transition-all opacity-70 hover:opacity-100 focus:opacity-100 z-10 shadow-sm border border-zinc-800/80"
                          >
                            <LayoutDashboard size={14} />
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Conversation Column */}
              <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
                {selectedTeam ? (
                  <>
                    {/* Chat Header */}
                    <div className="h-16 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-sm">
                      <div>
                        <h3 className="font-extrabold text-white text-lg tracking-tight flex items-center gap-2">
                          #{selectedTeam.name}
                        </h3>
                        <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>{selectedTeam.members?.length || 1} members</span>
                          <span>&bull;</span>
                          <span>Owner: <span className="text-zinc-300 font-medium">{selectedTeam.owner}</span></span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {(() => {
                          const memberRoles = selectedTeam.memberRoles || {};
                          const userRole = memberRoles[currentUser?.email] || (selectedTeam.owner === currentUser?.email ? "owner" : "member");
                          const isTeamOwnerOrAdmin = userRole === "owner" || userRole === "co-lead" || currentUser?.role === "admin";
                          if (isTeamOwnerOrAdmin) {
                            return (
                              <button
                                onClick={() => setShowManageTeamModal(true)}
                                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/60 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
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
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35"
                          id="invite-member-btn"
                        >
                          <UserPlus size={14} />
                          <span>Invite</span>
                        </button>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                            <MessageSquare size={24} />
                          </div>
                          <p className="text-sm font-medium text-zinc-400">No messages yet in #{selectedTeam.name}</p>
                          <p className="text-xs text-zinc-600">Start the conversation by sending a message below!</p>
                        </div>
                      ) : (
                        messages.map((m, i) => {
                          const isOwn = m.senderEmail === currentUser?.email;
                          const prevM = messages[i - 1];
                          const isSameSender = prevM && prevM.senderEmail === m.senderEmail;
                          const isCloseInTime = prevM && m.timestamp && prevM.timestamp && (new Date(m.timestamp).getTime() - new Date(prevM.timestamp).getTime() < 5 * 60 * 1000);
                          const isConsecutive = isSameSender && isCloseInTime;

                          // Consistent timestamp formatting e.g. "2:08 AM"
                          const formatTime = (ts) => {
                            if (!ts) return "";
                            const date = new Date(ts);
                            if (isNaN(date.getTime())) return "";
                            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                          };

                          return (
                            <div 
                              key={m.id || i} 
                              className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""} ${isConsecutive ? "mt-1" : "mt-4"}`}
                            >
                              {/* Avatar - only show on first message of group */}
                              {!isConsecutive ? (
                                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ring-2 ${
                                  isOwn 
                                    ? "bg-indigo-600 text-white border border-indigo-400/40 ring-indigo-500/20" 
                                    : "bg-zinc-800 text-zinc-200 border border-zinc-700/60 ring-zinc-800/40"
                                }`}>
                                  {m.senderName ? m.senderName.charAt(0).toUpperCase() : "U"}
                                </div>
                              ) : (
                                <div className="w-8 shrink-0" />
                              )}

                              {/* Message Content */}
                              <div className={`flex flex-col max-w-[70%] space-y-1 ${isOwn ? "items-end" : "items-start"}`}>
                                {!isConsecutive && (
                                  <div className={`flex items-center gap-2 text-xs px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                                    <span className="font-semibold text-zinc-300">{m.senderName}</span>
                                    <span className="text-zinc-600 text-[10px]">&bull;</span>
                                    <span className="text-[11px] text-zinc-500 font-mono">{formatTime(m.timestamp)}</span>
                                  </div>
                                )}
                                <div className={`px-4 py-2.5 text-sm break-words leading-relaxed ${
                                  isOwn 
                                    ? `bg-indigo-600 text-white shadow-md shadow-indigo-950/30 border border-indigo-500/30 ${isConsecutive ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tr-xs'}`
                                    : `bg-zinc-900 text-zinc-100 shadow-md shadow-black/20 border border-zinc-800/80 ${isConsecutive ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-tl-xs'}`
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
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
                      <div className="flex gap-2.5">
                        <input
                          id="chat-input"
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder={`Message #${selectedTeam.name}`}
                          className="flex-1 px-4 py-3 bg-zinc-900/90 border border-zinc-800 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm placeholder-zinc-500 outline-none transition-all text-white shadow-inner"
                        />
                        <button
                          id="send-message-btn"
                          type="submit"
                          className="p-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl transition-all shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 cursor-pointer flex items-center justify-center shrink-0"
                          title="Send Message"
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
      {showManageTeamModal && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-indigo-400" />
                Manage #{selectedTeam.name}
              </h3>
              <button
                onClick={() => { setShowManageTeamModal(false); setManageError(""); setManageSuccess(""); }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {manageError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-200 text-xs">
                {manageError}
              </div>
            )}

            {manageSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-200 text-xs">
                {manageSuccess}
              </div>
            )}

            {/* Rename Team Section */}
            <form onSubmit={handleRenameTeam} className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Rename Team
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manageTeamName || selectedTeam.name}
                  onChange={(e) => setManageTeamName(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-sm outline-none text-white"
                  placeholder="New Team Name"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                >
                  Rename
                </button>
              </div>
            </form>

            {/* Members List Section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Team Members ({selectedTeam.members?.length || 1})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {selectedTeam.members?.map((email) => {
                  const isOwner = email === selectedTeam.owner;
                  return (
                    <div key={email} className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800/60 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-200 shrink-0">
                          {email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-zinc-200 truncate">{email}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isOwner ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Owner
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveTeamMember(email)}
                            className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-lg text-xs font-medium cursor-pointer transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delete Team Section */}
            {selectedTeam.owner === currentUser?.email && (
              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-rose-400">Danger Zone</p>
                  <p className="text-[11px] text-zinc-500">Permanently delete this team and messages</p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteTeamByOwner}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Delete Team
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
