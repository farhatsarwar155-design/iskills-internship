"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, doc, getDoc, updateDoc, onSnapshot, collection, addDoc } from "@/lib/firebase";
import { 
  Video, Clock, Users, ArrowLeft, LogOut, FileText, Sparkles, 
  CheckSquare, Loader, Shield, Radio, CheckCircle2, UserCheck, AlertCircle, Plus 
} from "lucide-react";
import Link from "next/link";

export default function MeetingRoomPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const meetingId = resolvedParams.id;

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [meeting, setMeeting] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  
  // Live Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live Transcript / Notes State
  const [transcript, setTranscript] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [addingToTasks, setAddingToTasks] = useState(false);
  const [taskAddedToast, setTaskAddedToast] = useState(false);

  // 1. Fetch authenticated user
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
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [router]);

  // 2. Subscribe to Meeting Document & Presence
  useEffect(() => {
    if (!meetingId || !currentUser) return;

    const meetingRef = doc(db, "meetings", meetingId);
    
    const unsubscribe = onSnapshot(meetingRef, (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setMeeting(data);
        if (data.transcript && !transcript) {
          setTranscript(data.transcript);
        }
      } else {
        setMeeting(null);
      }
      setLoadingMeeting(false);
    });

    // Mark current user as joined in joinedParticipants
    const markJoined = async () => {
      try {
        const snap = await getDoc(meetingRef);
        if (snap.exists()) {
          const currentData = snap.data();
          const existingJoined = currentData.joinedParticipants || [];
          if (!existingJoined.includes(currentUser.email)) {
            await updateDoc(meetingRef, {
              joinedParticipants: [...existingJoined, currentUser.email],
              status: "in progress"
            });
          }
        }
      } catch (err) {
        console.error("Failed to update presence:", err);
      }
    };

    markJoined();

    return () => unsubscribe();
  }, [meetingId, currentUser]);

  // 3. Live Meeting Timer (seconds count since joining)
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Check host privilege
  const isHost = useMemo(() => {
    if (!meeting || !currentUser) return false;
    return meeting.hostId === currentUser.email || meeting.createdBy === currentUser.email;
  }, [meeting, currentUser]);

  // Save live transcript/notes to Firebase
  const handleSaveNotes = async () => {
    if (!meetingId) return;
    setIsSavingNotes(true);
    try {
      const meetingRef = doc(db, "meetings", meetingId);
      await updateDoc(meetingRef, { transcript });
    } catch (err) {
      console.error("Failed to save transcript:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // AI Summary Generation
  const handleGenerateSummary = async () => {
    if (!transcript.trim()) {
      setSummaryError("Please enter or paste meeting notes/transcript first.");
      return;
    }
    setIsGeneratingSummary(true);
    setSummaryError("");

    try {
      const res = await fetch("/api/ai/meeting-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, meetingId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate summary");

      const meetingRef = doc(db, "meetings", meetingId);
      await updateDoc(meetingRef, {
        summary: {
          ...data.summary,
          generatedAt: Date.now(),
          published: true
        },
        transcript
      });
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Add Action Items to Tasks
  const handleAddTasksToBoard = async () => {
    if (!meeting?.summary?.actionItems?.length || !currentUser) return;
    setAddingToTasks(true);
    try {
      const tasksRef = collection(db, "tasks");
      for (const item of meeting.summary.actionItems) {
        await addDoc(tasksRef, {
          teamId: meeting.teamId,
          title: item.task,
          description: `Generated from meeting: ${meeting.title}`,
          status: "todo",
          priority: item.priority || "medium",
          assignee: item.assignee || currentUser.email,
          createdAt: Date.now(),
          createdBy: currentUser.email
        });
      }
      setTaskAddedToast(true);
      setTimeout(() => setTaskAddedToast(false), 4000);
    } catch (err) {
      console.error("Failed to add tasks:", err);
    } finally {
      setAddingToTasks(false);
    }
  };

  if (loadingUser || loadingMeeting) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader size={32} className="animate-spin text-indigo-500" />
          <span className="text-sm text-zinc-400 font-medium">Entering Meeting Room…</span>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full space-y-4">
          <AlertCircle size={36} className="text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Meeting Not Found</h2>
          <p className="text-xs text-zinc-400">The meeting room you are trying to join does not exist or was deleted.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const allParticipants = meeting.participants || [];
  const joinedList = meeting.joinedParticipants || [currentUser?.email];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* ── ROOM HEADER ── */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <div className="h-6 w-px bg-zinc-800"></div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white truncate max-w-xs sm:max-w-md">{meeting.title}</h1>
              {isHost ? (
                <span className="px-2 py-0.5 text-[10px] bg-indigo-600/30 text-indigo-300 rounded-full border border-indigo-500/30 font-semibold shrink-0">
                  Host
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700 font-medium shrink-0">
                  Attendee
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 truncate hidden sm:block">
              Host: {meeting.hostId || meeting.createdBy}
            </p>
          </div>
        </div>

        {/* Live Timer & Leave Button */}
        <div className="flex items-center gap-4">
          {/* Live Timer Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-xs font-bold tracking-wider">{formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Leave Button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <LogOut size={14} />
            <span>Leave Meeting</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {taskAddedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Action items successfully added to Team Tasks board!</span>
        </div>
      )}

      {/* ── ROOM MAIN CONTENT ── */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT / MAIN COLUMN: Notes, Transcript & AI Summary (2 cols) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* Live Notes / Transcript Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600/20 rounded-xl">
                  <FileText size={18} className="text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Live Meeting Notes & Transcript</h2>
                  <p className="text-xs text-zinc-400">Collaborate live or paste notes during the meeting</p>
                </div>
              </div>

              {isHost && (
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingNotes ? <Loader size={13} className="animate-spin" /> : null}
                  <span>Save Notes</span>
                </button>
              )}
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={!isHost}
              placeholder={isHost ? "Type or paste live meeting discussion points, transcript, or key takeaways..." : "Waiting for host to take live notes..."}
              className="w-full h-48 px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-zinc-650 outline-none transition-all resize-y disabled:opacity-80"
            />

            {/* AI Summary Trigger Button (Host Only) */}
            {isHost && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                {summaryError ? (
                  <p className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle size={13} /> {summaryError}</p>
                ) : (
                  <p className="text-[11px] text-zinc-500">Generate an AI summary with key points and action items from these notes.</p>
                )}

                <button
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary || !transcript.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 shrink-0"
                >
                  {isGeneratingSummary ? (
                    <><Loader size={14} className="animate-spin" /> Generating AI Summary…</>
                  ) : (
                    <><Sparkles size={14} /> Generate AI Summary</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* AI Summary Display Card */}
          {meeting.summary && (
            <div className="bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-500/30 rounded-2xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 rounded-xl">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-indigo-200">AI Meeting Summary</h3>
                    <p className="text-xs text-indigo-300/70">Generated automatically from meeting notes</p>
                  </div>
                </div>

                <button
                  onClick={handleAddTasksToBoard}
                  disabled={addingToTasks || !meeting.summary.actionItems?.length}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {addingToTasks ? <Loader size={14} className="animate-spin" /> : <CheckSquare size={14} />}
                  <span>Add Action Items to Tasks</span>
                </button>
              </div>

              {/* Raw Executive Summary */}
              {meeting.summary.rawText && (
                <div className="p-4 bg-zinc-950/80 border border-indigo-500/20 rounded-xl text-xs text-indigo-100 leading-relaxed">
                  {meeting.summary.rawText}
                </div>
              )}

              {/* Key Points */}
              {meeting.summary.keyPoints?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Key Discussion Points</h4>
                  <ul className="space-y-1.5">
                    {meeting.summary.keyPoints.map((pt, i) => (
                      <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5"></span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Decisions */}
              {meeting.summary.decisions?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Decisions Made</h4>
                  <ul className="space-y-1.5">
                    {meeting.summary.decisions.map((dec, i) => (
                      <li key={i} className="text-xs text-zinc-300 flex items-start gap-2 bg-emerald-950/20 border border-emerald-800/30 p-2 rounded-lg">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{dec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {meeting.summary.actionItems?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Action Items</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {meeting.summary.actionItems.map((act, i) => (
                      <div key={i} className="p-3 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-amber-400 px-1.5 py-0.5 bg-amber-950/40 rounded border border-amber-800/40">
                            {act.priority || "Medium"}
                          </span>
                          {act.assignee && (
                            <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[120px]">
                              @{act.assignee}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-zinc-200">{act.task}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Room Details & Participant Presence (1 col) */}
        <div className="space-y-6">
          
          {/* Room Details Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio size={16} className="text-emerald-400 animate-pulse" /> Meeting Info
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Scheduled Date</span>
                <span className="text-zinc-300 font-medium">{meeting.date}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Scheduled Time</span>
                <span className="text-zinc-300 font-medium">{meeting.time} ({meeting.duration} mins)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Host</span>
                <span className="text-indigo-400 font-semibold">{meeting.hostId || meeting.createdBy}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">Status</span>
                <span className="text-emerald-400 font-semibold uppercase text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/40">
                  {meeting.status || "In Progress"}
                </span>
              </div>
            </div>

            {meeting.description && (
              <div className="pt-2 border-t border-zinc-800">
                <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Description</h4>
                <p className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-xl border border-zinc-800/60">{meeting.description}</p>
              </div>
            )}
          </div>

          {/* Participant Presence Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-indigo-400" /> Participants Presence
              </h3>
              <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-300 rounded-full font-semibold">
                {joinedList.length} / {allParticipants.length}
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {allParticipants.map((email) => {
                const isJoined = joinedList.includes(email);
                const isMe = email === currentUser?.email;
                const isMeetingHost = email === meeting.hostId || email === meeting.createdBy;

                return (
                  <div
                    key={email}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isJoined 
                        ? "bg-zinc-950 border-emerald-500/30 text-zinc-200" 
                        : "bg-zinc-950/40 border-zinc-800/40 text-zinc-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isJoined 
                            ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40" 
                            : "bg-zinc-800 text-zinc-500"
                        }`}>
                          {email.charAt(0).toUpperCase()}
                        </div>
                        {isJoined && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {email} {isMe ? "(You)" : ""}
                        </p>
                        {isMeetingHost && (
                          <span className="text-[9px] text-indigo-400 font-bold uppercase">Host</span>
                        )}
                      </div>
                    </div>

                    <div>
                      {isJoined ? (
                        <span className="px-2 py-0.5 text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 rounded-full font-semibold flex items-center gap-1 shrink-0">
                          <UserCheck size={11} /> Joined
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] bg-zinc-800/80 text-zinc-500 rounded-full font-medium shrink-0">
                          Invited
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
