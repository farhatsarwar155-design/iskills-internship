"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db, collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "@/lib/firebase";
import { 
  Video, Calendar as CalendarIcon, Clock, Users, Plus, ChevronLeft, ChevronRight, 
  FileText, Sparkles, CheckSquare, Loader, Edit3, Trash2, Play, Globe, ShieldAlert, Crown, CheckCircle2 
} from "lucide-react";
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, 
  isSameDay, isToday, addMonths, subMonths, parseISO, isAfter, isBefore, startOfDay 
} from "date-fns";

export default function MeetingsTab({ selectedTeam, currentUser, initialViewMode = "all" }) {
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [viewMode, setViewMode] = useState(initialViewMode);

  const isMeetingJoinable = (m) => {
    if (!m) return false;
    if (m.status === "in progress" || m.status === "in_progress") return true;
    if (!m.date) return true;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return m.date <= todayStr;
  };
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [addingToTasks, setAddingToTasks] = useState(false);
  
  // Host Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDuration, setEditDuration] = useState("30");
  const [editDescription, setEditDescription] = useState("");
  const [editParticipants, setEditParticipants] = useState([]);
  const [publishingSummary, setPublishingSummary] = useState(false);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Schedule Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [participants, setParticipants] = useState([]); // array of emails
  const [description, setDescription] = useState("");

  // Keep viewMode synced if initialViewMode prop changes
  useEffect(() => {
    if (initialViewMode) setViewMode(initialViewMode);
  }, [initialViewMode]);

  // Fetch meetings for selected team
  useEffect(() => {
    if (!selectedTeam) {
      setMeetings([]);
      return;
    }

    const meetingsRef = collection(db, "meetings");
    const q = query(meetingsRef, where("teamId", "==", selectedTeam.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = [];
      snapshot.forEach(docSnap => {
        docs.push({ id: docSnap.id, ...docSnap.data() });
      });
      docs.sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}`).getTime();
        const timeB = new Date(`${b.date}T${b.time}`).getTime();
        return timeA - timeB;
      });
      setMeetings(docs);
    });

    return () => unsubscribe();
  }, [selectedTeam]);

  // Filtered Meetings Calculations
  const createdMeetings = useMemo(() => {
    return meetings.filter(m => m.hostId === currentUser?.email || m.createdBy === currentUser?.email);
  }, [meetings, currentUser]);

  const joiningMeetings = useMemo(() => {
    return meetings.filter(m => 
      m.participants?.includes(currentUser?.email) && 
      m.hostId !== currentUser?.email && 
      m.createdBy !== currentUser?.email
    );
  }, [meetings, currentUser]);

  // Calendar Grid Calculations
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startDayOfWeek = start.getDay(); // 0-6 (Sun-Sat)
    
    const paddingDays = Array.from({ length: startDayOfWeek }, () => null);
    const monthDays = eachDayOfInterval({ start, end });
    return [...paddingDays, ...monthDays];
  }, [currentDate]);

  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Stats Calculations
  const now = new Date();
  const upcomingMeetings = meetings.filter(m => isAfter(new Date(`${m.date}T${m.time}`), now) || isSameDay(new Date(`${m.date}T${m.time}`), now));
  const pastMeetings = meetings.filter(m => isBefore(new Date(`${m.date}T${m.time}`), now) && !isSameDay(new Date(`${m.date}T${m.time}`), now));

  const createdStats = useMemo(() => {
    const total = createdMeetings.length;
    const upcoming = createdMeetings.filter(m => isAfter(new Date(`${m.date}T${m.time}`), now) || isSameDay(new Date(`${m.date}T${m.time}`), now)).length;
    const completed = createdMeetings.filter(m => isBefore(new Date(`${m.date}T${m.time}`), now) && !isSameDay(new Date(`${m.date}T${m.time}`), now)).length;
    return { total, upcoming, completed };
  }, [createdMeetings, now]);

  const joiningStats = useMemo(() => {
    const total = joiningMeetings.length;
    const upcoming = joiningMeetings.filter(m => isAfter(new Date(`${m.date}T${m.time}`), now) || isSameDay(new Date(`${m.date}T${m.time}`), now)).length;
    const today = joiningMeetings.filter(m => isSameDay(parseISO(m.date), new Date())).length;
    return { total, upcoming, today };
  }, [joiningMeetings, now]);

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time || !selectedTeam) return;

    try {
      // Always include the host in participants; merge with selected teammates
      const allParticipants = [currentUser.email, ...participants.filter(e => e !== currentUser.email)];

      const meetingData = {
        teamId: selectedTeam.id,
        title,
        date,
        time,
        duration: parseInt(duration),
        participants: allParticipants,
        description,
        createdAt: Date.now(),
        createdBy: currentUser.email,
        hostId: currentUser.email,
        status: "scheduled"
      };

      await addDoc(collection(db, "meetings"), meetingData);

      // Create notifications for participants
      for (const participantEmail of participants) {
        if (participantEmail !== currentUser.email) {
          await addDoc(collection(db, "notifications"), {
            userEmail: participantEmail,
            type: "meeting",
            title: "Meeting Scheduled",
            message: `${currentUser.name || currentUser.email} scheduled a meeting "${title}" for ${date} at ${time}.`,
            read: false,
            timestamp: Date.now(),
            linkId: selectedTeam.id
          });
          
          // Send email notification
          fetch("/api/notifications/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: participantEmail,
              subject: `Meeting Invite: ${title}`,
              html: `<p><b>${currentUser.name || currentUser.email}</b> scheduled a meeting in team <b>${selectedTeam.name}</b>.</p><p><i>${title}</i></p><p>When: ${date} at ${time}</p><p>Duration: ${duration} minutes</p>`,
              type: "meeting"
            })
          }).catch(err => console.error("Failed to trigger meeting email", err));
        }
      }

      setShowModal(false);
      setTitle("");
      setDate("");
      setTime("");
      setDuration("30");
      setParticipants([]);
      setDescription("");
    } catch (err) {
      console.error("Failed to schedule meeting", err);
    }
  };

  const toggleParticipant = (email) => {
    setParticipants(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  // All unique team members
  const teamMembers = [selectedTeam?.owner, ...(selectedTeam?.members || [])].filter((v, i, a) => a.indexOf(v) === i && v);
  // Team members excluding the current host (shown as selectable in schedule form)
  const otherTeamMembers = teamMembers.filter(email => email !== currentUser?.email);

  const openMeetingModal = (m) => {
    setSelectedMeeting(m);
    setTranscript(m.transcript || "");
    setSummaryError("");
    setIsEditing(false);
    setEditTitle(m.title || "");
    setEditDate(m.date || "");
    setEditTime(m.time || "");
    setEditDuration(m.duration ? m.duration.toString() : "30");
    setEditDescription(m.description || "");
    setEditParticipants(m.participants || []);
    setShowMeetingModal(true);
  };

  // Host Action Handlers
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    try {
      const meetingRef = doc(db, "meetings", selectedMeeting.id);
      const updates = {
        title: editTitle,
        date: editDate,
        time: editTime,
        duration: parseInt(editDuration),
        description: editDescription,
        participants: editParticipants
      };
      await updateDoc(meetingRef, updates);
      setSelectedMeeting(prev => ({ ...prev, ...updates }));
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update meeting", err);
      setSummaryError(err.message || "Failed to update meeting");
    }
  };

  const handleCancelMeeting = async (meetingToCancel) => {
    const target = meetingToCancel || selectedMeeting;
    if (!target) return;
    if (window.confirm(`Are you sure you want to cancel "${target.title}"?`)) {
      try {
        await deleteDoc(doc(db, "meetings", target.id));
        if (selectedMeeting?.id === target.id) {
          setShowMeetingModal(false);
          setSelectedMeeting(null);
        }
      } catch (err) {
        console.error("Failed to cancel meeting", err);
        setSummaryError(err.message || "Failed to cancel meeting");
      }
    }
  };

  const handleStartMeeting = async (meetingToStart) => {
    const target = meetingToStart || selectedMeeting;
    if (!target) return;
    try {
      const meetingRef = doc(db, "meetings", target.id);
      await updateDoc(meetingRef, { status: "in progress" });
      if (selectedMeeting?.id === target.id) {
        setSelectedMeeting(prev => ({ ...prev, status: "in progress" }));
      }
    } catch (err) {
      console.error("Failed to start meeting", err);
    }
  };

  const handleTogglePublishSummary = async (publishState) => {
    if (!selectedMeeting?.summary) return;
    setPublishingSummary(true);
    try {
      const meetingRef = doc(db, "meetings", selectedMeeting.id);
      await updateDoc(meetingRef, { "summary.published": publishState });
      setSelectedMeeting(prev => ({
        ...prev,
        summary: { ...prev.summary, published: publishState }
      }));
    } catch (err) {
      console.error("Failed to update summary publication state", err);
    } finally {
      setPublishingSummary(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!transcript.trim()) {
      setSummaryError("Please enter a transcript first.");
      return;
    }
    
    setIsGeneratingSummary(true);
    setSummaryError("");
    
    try {
      const res = await fetch("/api/ai/meeting-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          teamId: selectedTeam.id,
          meetingId: selectedMeeting.id
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }
      
      // Save summary (published by default on creation so host & attendees can view)
      const meetingRef = doc(db, "meetings", selectedMeeting.id);
      const summaryPayload = { ...data.summary, published: true };
      const updates = {
        transcript: transcript,
        summary: summaryPayload,
        summaryGeneratedAt: Date.now()
      };
      
      await updateDoc(meetingRef, updates);
      setSelectedMeeting(prev => ({ ...prev, ...updates }));
    } catch (err) {
      console.error(err);
      setSummaryError(err.message || "An error occurred");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAddAsTasks = async () => {
    if (!selectedMeeting?.summary?.actionItems || addingToTasks) return;
    
    setAddingToTasks(true);
    try {
      const tasksRef = collection(db, "tasks");
      for (const item of selectedMeeting.summary.actionItems) {
        await addDoc(tasksRef, {
          title: item.task,
          description: `Auto-generated from meeting: ${selectedMeeting.title}`,
          status: "todo",
          assignee: item.assignee || null,
          priority: item.priority || "medium",
          teamId: selectedTeam.id,
          createdAt: Date.now()
        });
      }
      
      // Mark action items as added
      const meetingRef = doc(db, "meetings", selectedMeeting.id);
      await updateDoc(meetingRef, {
        "summary.tasksAdded": true
      });
      setSelectedMeeting(prev => ({
        ...prev,
        summary: { ...prev.summary, tasksAdded: true }
      }));
    } catch (err) {
      console.error("Error adding tasks:", err);
      setSummaryError("Failed to add tasks to Kanban board.");
    } finally {
      setAddingToTasks(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto">
      
      {/* Header Bar & Segment Switcher */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">
            {viewMode === "created" ? "Meetings I Created" : viewMode === "joining" ? "Meetings to Join" : "Video Meetings"}
          </h3>
          <p className="text-sm text-zinc-400">
            {viewMode === "created" 
              ? "Meetings where you are the host with full edit & summary permissions" 
              : viewMode === "joining" 
              ? "Meetings you have been invited to participate in" 
              : `Schedule and manage calls for ${selectedTeam?.name || "your team"}`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Segment Switcher */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "all"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <CalendarIcon size={14} /> All & Calendar
            </button>
            <button
              onClick={() => setViewMode("created")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "created"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Crown size={14} /> Created ({createdMeetings.length})
            </button>
            <button
              onClick={() => setViewMode("joining")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "joining"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Users size={14} /> Joining ({joiningMeetings.length})
            </button>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
          >
            <CalendarIcon size={16} /> Schedule Meeting
          </button>
        </div>
      </div>

      {/* DASHBOARD VIEW: MEETINGS I CREATED */}
      {viewMode === "created" && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Total Meetings Created</span>
                <Crown size={16} className="text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{createdStats.total}</div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Upcoming Count</span>
                <Clock size={16} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">{createdStats.upcoming}</div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Completed Count</span>
                <CheckCircle2 size={16} className="text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-zinc-300">{createdStats.completed}</div>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">My Created Meetings</h4>
            {createdMeetings.length === 0 ? (
              <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800/80 rounded-2xl text-zinc-500">
                <Crown size={32} className="mx-auto mb-2 text-zinc-600" />
                <p className="text-sm font-medium">You haven't created any meetings yet.</p>
                <p className="text-xs text-zinc-600 mt-1">Click "Schedule Meeting" to host a call with your team.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {createdMeetings.map(m => (
                  <div key={m.id} className="p-5 bg-zinc-900 border border-indigo-500/20 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] bg-indigo-600/30 text-indigo-300 rounded border border-indigo-500/20 font-bold">Host</span>
                          {m.status === "in progress" && (
                            <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold animate-pulse">● Live</span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500">{format(parseISO(m.date), "MMM d, yyyy")}</span>
                      </div>
                      <h5 className="font-bold text-white text-lg">{m.title}</h5>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span className="flex items-center gap-1"><Clock size={12}/> {m.time} ({m.duration}m)</span>
                        <span className="flex items-center gap-1"><Users size={12}/> {m.participants?.length || 0} participants</span>
                      </div>
                      {m.description && (
                        <p className="text-xs text-zinc-400 mt-3 line-clamp-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">{m.description}</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => { openMeetingModal(m); setIsEditing(true); }}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        {m.status !== "in progress" && (
                          <button
                            onClick={() => handleStartMeeting(m)}
                            className="px-2.5 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Play size={12} /> Start
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelMeeting(m)}
                          className="px-2.5 py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} /> Cancel
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {(() => {
                          const canJoin = isMeetingJoinable(m);
                          return (
                            <button
                              onClick={() => {
                                if (canJoin) router.push(`/meetings/${m.id}/room`);
                              }}
                              disabled={!canJoin}
                              title={!canJoin ? "Meeting hasn't started yet" : "Join live meeting room"}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                                canJoin 
                                  ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-600/20" 
                                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50 opacity-60"
                              }`}
                            >
                              <Video size={13} /> Join Room
                            </button>
                          );
                        })()}

                        <button
                          onClick={() => openMeetingModal(m)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles size={12} /> Notes & AI
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DASHBOARD VIEW: MEETINGS TO JOIN */}
      {viewMode === "joining" && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Total Invited Meetings</span>
                <Users size={16} className="text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{joiningStats.total}</div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Upcoming Count</span>
                <CalendarIcon size={16} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">{joiningStats.upcoming}</div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Meetings Today</span>
                <Clock size={16} className="text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-amber-400">{joiningStats.today}</div>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Meetings You Are Invited To</h4>
            {joiningMeetings.length === 0 ? (
              <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800/80 rounded-2xl text-zinc-500">
                <Users size={32} className="mx-auto mb-2 text-zinc-600" />
                <p className="text-sm font-medium">No invited meetings to join right now.</p>
                <p className="text-xs text-zinc-600 mt-1">When teammates invite you to calls, they will appear here automatically.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {joiningMeetings.map(m => (
                  <div key={m.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded font-medium">Attendee View</span>
                        <span className="text-xs text-zinc-500">{format(parseISO(m.date), "MMM d, yyyy")}</span>
                      </div>
                      <h5 className="font-bold text-white text-lg">{m.title}</h5>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span className="flex items-center gap-1"><Clock size={12}/> {m.time} ({m.duration}m)</span>
                        <span className="flex items-center gap-1 text-indigo-400 font-medium">Host: {m.hostId || m.createdBy}</span>
                      </div>
                      {m.description && (
                        <p className="text-xs text-zinc-400 mt-3 line-clamp-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">{m.description}</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => openMeetingModal(m)}
                        className="text-xs text-zinc-400 hover:text-zinc-200 underline font-medium cursor-pointer"
                      >
                        View Details & Summary
                      </button>
                      {(() => {
                        const canJoin = isMeetingJoinable(m);
                        return (
                          <button
                            onClick={() => {
                              if (canJoin) router.push(`/meetings/${m.id}/room`);
                            }}
                            disabled={!canJoin}
                            title={!canJoin ? "Meeting hasn't started yet" : "Join live meeting room"}
                            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                              canJoin
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-600/20"
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50 opacity-60"
                            }`}
                          >
                            <Video size={14} /> Join Meeting
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEFAULT COMBINED VIEW: ALL MEETINGS & CALENDAR */}
      {viewMode === "all" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: List Views */}
          <div className="lg:col-span-1 space-y-6 flex flex-col min-h-0">
            
            {/* Upcoming Meetings */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col max-h-[50vh]">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 sticky top-0 bg-zinc-900">Upcoming</h4>
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {upcomingMeetings.length === 0 ? (
                  <div className="text-sm text-zinc-500 text-center py-4">No upcoming meetings.</div>
                ) : (
                  upcomingMeetings.map(m => {
                    const isHost = m.hostId === currentUser?.email || m.createdBy === currentUser?.email;
                    return (
                      <div key={m.id} onClick={() => openMeetingModal(m)} className="p-4 bg-zinc-950 border border-indigo-500/30 rounded-xl relative overflow-hidden group cursor-pointer hover:border-indigo-500/50 transition-all">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <div className="flex items-center gap-2 mb-1 justify-between">
                          <h5 className="font-bold text-white text-sm truncate flex-1">{m.title}</h5>
                          {isHost && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-indigo-600/30 text-indigo-300 rounded border border-indigo-500/20 font-semibold shrink-0">
                              Host
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mb-2">
                          <div className="flex items-center gap-1"><CalendarIcon size={12}/> {format(parseISO(m.date), "MMM d, yyyy")}</div>
                          <div className="flex items-center gap-1"><Clock size={12}/> {m.time} ({m.duration}m)</div>
                        </div>
                        <div className="flex justify-between items-end mt-3">
                          <div className="flex -space-x-2 overflow-hidden">
                            {m.participants.slice(0, 3).map((p, i) => (
                              <div key={i} title={p} className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                                {p.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {m.participants.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                +{m.participants.length - 3}
                              </div>
                            )}
                          </div>
                          {(() => {
                            const canJoin = isMeetingJoinable(m);
                            return (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canJoin) {
                                    router.push(`/meetings/${m.id}/room`);
                                  } else {
                                    openMeetingModal(m);
                                  }
                                }}
                                title={!canJoin ? "Meeting hasn't started yet" : isHost ? "Manage or Join Room" : "Join Room"}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  canJoin
                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm shadow-indigo-600/20"
                                    : isHost
                                      ? "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white cursor-pointer"
                                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50 opacity-60"
                                }`}
                              >
                                {canJoin ? "Join Room" : isHost ? "Manage" : "Join"}
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Past Meetings */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col flex-1 min-h-[30vh]">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4 sticky top-0 bg-zinc-900">Past</h4>
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {pastMeetings.length === 0 ? (
                  <div className="text-sm text-zinc-500 text-center py-4">No past meetings.</div>
                ) : (
                  pastMeetings.map(m => {
                    const isHost = m.hostId === currentUser?.email || m.createdBy === currentUser?.email;
                    return (
                      <div key={m.id} onClick={() => openMeetingModal(m)} className="p-3 bg-zinc-950/50 border border-zinc-800/50 rounded-xl opacity-75 hover:opacity-100 cursor-pointer transition-opacity">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-semibold text-zinc-300 text-sm truncate">{m.title}</h5>
                          {isHost && (
                            <span className="px-1.5 py-0.5 text-[9px] bg-zinc-800 text-zinc-400 rounded font-medium">Host</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <div className="flex items-center gap-1"><CalendarIcon size={12}/> {format(parseISO(m.date), "MMM d")}</div>
                          <div className="flex items-center gap-1"><Clock size={12}/> {m.time}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Calendar Grid */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-white">{format(currentDate, "MMMM yyyy")}</h4>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"><ChevronLeft size={16}/></button>
                <button onClick={handleNextMonth} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"><ChevronRight size={16}/></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-xl overflow-hidden border border-zinc-800">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-zinc-900 p-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
              
              {daysInMonth.map((dateObj, idx) => {
                if (!dateObj) {
                  return <div key={`empty-${idx}`} className="bg-zinc-900/50 min-h-[100px] p-2"></div>;
                }

                const isTodayDate = isToday(dateObj);
                const dateString = format(dateObj, "yyyy-MM-dd");
                const dayMeetings = meetings.filter(m => m.date === dateString);

                return (
                  <div 
                    key={dateString} 
                    className={`bg-zinc-950 min-h-[100px] p-2 relative group hover:bg-zinc-800/50 transition-colors ${
                      isTodayDate ? 'ring-inset ring-1 ring-indigo-500' : ''
                    }`}
                  >
                    <span className={`text-sm font-semibold ${isTodayDate ? 'text-indigo-400' : 'text-zinc-400'}`}>
                      {format(dateObj, "d")}
                    </span>
                    
                    <div className="mt-2 space-y-1">
                      {dayMeetings.map((m, i) => (
                        <div 
                          key={i} 
                          onClick={() => openMeetingModal(m)}
                          className="px-1.5 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded text-[10px] text-indigo-200 truncate cursor-pointer hover:bg-indigo-500/40"
                          title={`${m.title} at ${m.time}`}
                        >
                          {m.time} {m.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SCHEDULE MEETING MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-850 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Video size={20} className="text-indigo-400"/> Schedule Meeting
            </h3>
            
            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Standup"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder-zinc-650 outline-none text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Duration (Minutes)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white"
                >
                  <option value="15">15 mins</option>
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Invite Participants</label>
                {/* Host is always included automatically */}
                <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-indigo-950/30 border border-indigo-500/20 rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-indigo-400 shrink-0"></span>
                  <span className="text-xs text-indigo-300 font-medium">{currentUser?.email}</span>
                  <span className="text-[10px] bg-indigo-600/40 text-indigo-200 px-1.5 py-0.5 rounded ml-auto">Host (auto-included)</span>
                </div>
                {otherTeamMembers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-xl">
                    No other team members yet. Invite teammates to your team first.
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 max-h-40 overflow-y-auto">
                    {otherTeamMembers.map(email => (
                      <label key={email} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-zinc-900 rounded-lg transition-colors">
                        <input 
                          type="checkbox" 
                          checked={participants.includes(email)}
                          onChange={() => toggleParticipant(email)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-950"
                        />
                        <span className="text-sm text-zinc-300">{email}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-zinc-500 mt-2">
                  Selected teammates will receive a notification and see this meeting in their "Meetings to Join" dashboard.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Agenda or meeting link..."
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder-zinc-650 outline-none text-white min-h-[60px]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEETING DETAILS / AI SUMMARY MODAL */}
      {showMeetingModal && selectedMeeting && (() => {
        const isHost = selectedMeeting.hostId === currentUser?.email || selectedMeeting.createdBy === currentUser?.email;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-850 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-zinc-800 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-white">{selectedMeeting.title}</h3>
                    {isHost ? (
                      <span className="px-2 py-0.5 text-xs bg-indigo-600/30 text-indigo-300 rounded-full border border-indigo-500/30 font-semibold">
                        Host
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700 font-medium">
                        Attendee View
                      </span>
                    )}
                    {selectedMeeting.status === "in progress" && (
                      <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1 flex items-center gap-3 flex-wrap">
                    <span>{format(parseISO(selectedMeeting.date), "MMMM d, yyyy")} at {selectedMeeting.time} ({selectedMeeting.duration} mins)</span>
                    <span className="text-zinc-500">• Host: {selectedMeeting.hostId || selectedMeeting.createdBy}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setShowMeetingModal(false); setIsEditing(false); }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">

                {/* HOST-ONLY TOP ACTION BAR */}
                {isHost && (
                  <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between flex-wrap gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <ShieldAlert size={14} /> Host Controls
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 size={13} /> {isEditing ? "Cancel Editing" : "Edit Meeting"}
                      </button>
                      
                      {selectedMeeting.status !== "in progress" && (
                        <button
                          onClick={() => handleStartMeeting()}
                          className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play size={13} /> Start Meeting
                        </button>
                      )}

                      <button
                        onClick={() => handleCancelMeeting()}
                        className="px-3 py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={13} /> Cancel Meeting
                      </button>
                    </div>
                  </div>
                )}

                {/* EDIT FORM (HOST ONLY) */}
                {isHost && isEditing ? (
                  <form onSubmit={handleSaveEdit} className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Edit Meeting Details</h4>
                    
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1 font-medium">Title</label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1 font-medium">Date</label>
                        <input
                          type="date"
                          required
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1 font-medium">Time</label>
                        <input
                          type="time"
                          required
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1 font-medium">Duration (Mins)</label>
                        <select
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white outline-none"
                        >
                          <option value="15">15 mins</option>
                          <option value="30">30 mins</option>
                          <option value="45">45 mins</option>
                          <option value="60">1 hour</option>
                          <option value="90">1.5 hours</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1 font-medium">Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white outline-none min-h-[60px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1 font-medium">Participants</label>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1.5 max-h-36 overflow-y-auto">
                        {teamMembers.map(email => (
                          <label key={email} className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                            <input 
                              type="checkbox" 
                              checked={editParticipants.includes(email)}
                              onChange={() => {
                                setEditParticipants(prev => 
                                  prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
                                );
                              }}
                              className="rounded border-zinc-700 bg-zinc-800 text-indigo-600"
                            />
                            <span>{email}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  /* READ-ONLY DETAILS DISPLAY */
                  <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl space-y-3">
                    {selectedMeeting.description && (
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Description</h4>
                        <p className="text-sm text-zinc-300">{selectedMeeting.description}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Participants ({selectedMeeting.participants?.length || 0})</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedMeeting.participants?.map((p, i) => (
                          <span key={i} className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span> {p} {p === selectedMeeting.hostId || p === selectedMeeting.createdBy ? "(Host)" : ""}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* JOIN ACTION BUTTON */}
                    <div className="pt-2 flex justify-end">
                      {(() => {
                        const canJoin = isMeetingJoinable(selectedMeeting);
                        return (
                          <button
                            onClick={() => {
                              if (canJoin) {
                                setShowMeetingModal(false);
                                router.push(`/meetings/${selectedMeeting.id}/room`);
                              }
                            }}
                            disabled={!canJoin}
                            title={!canJoin ? "Meeting hasn't started yet" : "Enter live meeting room"}
                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                              canJoin
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg shadow-indigo-600/20"
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50 opacity-60"
                            }`}
                          >
                            <Video size={16} /> {canJoin ? "Enter Live Meeting Room" : "Meeting Hasn't Started Yet"}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* TRANSCRIPT & AI SUMMARY SECTION */}
                {/* HOST VIEW: Can enter transcript and generate AI summary */}
                {isHost && !isEditing && (
                  <div className="border-t border-zinc-800/80 pt-6">
                    <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 mb-2">
                      <FileText size={16} className="text-indigo-400" />
                      Meeting Notes / Transcript (Host Only)
                    </label>
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="Paste meeting transcript here to generate an AI summary..."
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-sm placeholder-zinc-650 outline-none text-white min-h-[100px]"
                    />
                    <div className="flex justify-between items-center mt-2">
                      {summaryError ? <p className="text-rose-400 text-xs">{summaryError}</p> : <div></div>}
                      <button
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary || !transcript.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl text-sm font-semibold cursor-pointer transition-all flex items-center gap-2"
                      >
                        {isGeneratingSummary ? (
                          <><Loader size={14} className="animate-spin" /> Generating...</>
                        ) : (
                          <><Sparkles size={14} /> Generate Summary</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* AI SUMMARY DISPLAY */}
                {selectedMeeting.summary && (isHost || selectedMeeting.summary.published) ? (
                  <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
                        <Sparkles size={18} /> AI Summary
                      </h4>
                      {isHost && (
                        <button
                          onClick={() => handleTogglePublishSummary(!selectedMeeting.summary.published)}
                          disabled={publishingSummary}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            selectedMeeting.summary.published 
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          <Globe size={13} />
                          {selectedMeeting.summary.published ? "Published to Teammates" : "Private (Publish to Attendees)"}
                        </button>
                      )}
                    </div>

                    {selectedMeeting.summary.rawText && (
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {selectedMeeting.summary.rawText}
                      </p>
                    )}

                    {selectedMeeting.summary.keyPoints?.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Key Discussion Points</h5>
                        <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                          {selectedMeeting.summary.keyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                        </ul>
                      </div>
                    )}

                    {selectedMeeting.summary.decisions?.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Decisions Made</h5>
                        <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                          {selectedMeeting.summary.decisions.map((dec, i) => <li key={i}>{dec}</li>)}
                        </ul>
                      </div>
                    )}

                    {selectedMeeting.summary.actionItems?.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Action Items</h5>
                        <div className="space-y-2">
                          {selectedMeeting.summary.actionItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 bg-zinc-900/50 p-2.5 rounded-lg text-sm border border-zinc-800/50">
                              <CheckSquare size={14} className="text-zinc-500" />
                              <span className="text-zinc-300 flex-1">{item.task}</span>
                              {item.assignee && (
                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
                                  {item.assignee}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {isHost && (
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={handleAddAsTasks}
                              disabled={addingToTasks || selectedMeeting.summary.tasksAdded}
                              className="px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white disabled:bg-zinc-800 disabled:text-zinc-500 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-2"
                            >
                              {addingToTasks ? "Adding..." : selectedMeeting.summary.tasksAdded ? "Added to Tasks" : "+ Add to Tasks Board"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : !isHost && (
                  <div className="border-t border-zinc-800/80 pt-4 text-center py-6">
                    <p className="text-xs text-zinc-500 italic flex items-center justify-center gap-1.5">
                      <Sparkles size={14} className="text-zinc-600" />
                      AI Meeting summary has not been published by the host yet.
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
