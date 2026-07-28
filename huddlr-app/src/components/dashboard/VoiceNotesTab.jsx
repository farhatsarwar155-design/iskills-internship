"use client";

import { useState, useEffect, useRef } from "react";
import { db, collection, query, where, onSnapshot, addDoc, doc, updateDoc } from "@/lib/firebase";
import { Mic, Square, Play, Pause, Trash2, Upload, Users, Clock, Volume2, Loader } from "lucide-react";

export default function VoiceNotesTab({ selectedTeam, currentUser }) {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRefs = useRef({});

  // Fetch voice notes for this team
  useEffect(() => {
    if (!selectedTeam) return;

    const notesRef = collection(db, "voiceNotes");
    const q = query(notesRef, where("teamId", "==", selectedTeam.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = [];
      snapshot.forEach(docSnap => {
        notes.push({ id: docSnap.id, ...docSnap.data() });
      });
      notes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setVoiceNotes(notes);
    });

    return () => unsubscribe();
  }, [selectedTeam]);

  // Start recording
  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = handleRecordingStop;
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err) {
      setError("Microphone access denied. Please allow microphone access in your browser settings.");
      console.error("Mic access error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const handleRecordingStop = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    chunksRef.current = [];
    await uploadVoiceNote(blob);
  };

  const uploadVoiceNote = async (blob) => {
    setIsUploading(true);
    try {
      // Convert to base64 for mock storage (or use real Firebase Storage URL in prod)
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Audio = e.target.result; // data:audio/webm;base64,...

        await addDoc(collection(db, "voiceNotes"), {
          teamId: selectedTeam.id,
          senderEmail: currentUser.email,
          senderName: currentUser.name || currentUser.email,
          audioData: base64Audio,
          duration: recordingTime,
          timestamp: Date.now(),
          size: Math.round(blob.size / 1024), // KB
        });

        // Create notification for other team members
        if (selectedTeam.members) {
          for (const member of selectedTeam.members) {
            if (member !== currentUser.email) {
              await addDoc(collection(db, "notifications"), {
                userEmail: member,
                type: "chat", // Reusing chat icon/type for simplicity, or we can use "voice" if we update NotificationsDropdown
                title: "New Voice Note",
                message: `${currentUser.name || currentUser.email} shared a voice note in team ${selectedTeam.name}.`,
                read: false,
                timestamp: Date.now(),
                linkId: selectedTeam.id
              }).catch(err => console.error(err));
            }
          }
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setError("Failed to upload voice note. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      setRecordingTime(0);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      // In a real app with Firebase Storage, we'd delete the file too
      const noteRef = doc(db, "voiceNotes", noteId);
      await updateDoc(noteRef, { deleted: true });
      // Optimistically remove
      setVoiceNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const togglePlay = (noteId, audioData) => {
    if (playingId === noteId) {
      // Stop current
      if (audioRefs.current[noteId]) {
        audioRefs.current[noteId].pause();
        audioRefs.current[noteId].currentTime = 0;
      }
      setPlayingId(null);
    } else {
      // Stop any previous
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId].pause();
      }
      
      if (!audioRefs.current[noteId]) {
        const audio = new Audio(audioData);
        audio.onended = () => setPlayingId(null);
        audioRefs.current[noteId] = audio;
      }
      audioRefs.current[noteId].play();
      setPlayingId(noteId);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="p-6 h-full flex flex-col max-h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Voice Notes</h3>
          <p className="text-sm text-zinc-400">Record and share audio notes with {selectedTeam?.name}</p>
        </div>
      </div>

      {/* Recorder Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex flex-col items-center gap-4">
          {isRecording ? (
            <>
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center animate-pulse">
                  <Mic size={32} className="text-rose-400" />
                </div>
                {/* Pulse rings */}
                <div className="absolute inset-0 rounded-full border-2 border-rose-500/30 animate-ping"></div>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-bold text-rose-400">{formatTime(recordingTime)}</p>
                <p className="text-xs text-zinc-500 mt-1">Recording in progress...</p>
              </div>
              <button
                onClick={stopRecording}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <Square size={16} /> Stop Recording
              </button>
            </>
          ) : isUploading ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader size={32} className="text-indigo-400 animate-spin" />
              <p className="text-sm text-zinc-400">Saving voice note...</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center hover:bg-indigo-500/20 transition-all cursor-pointer" onClick={startRecording}>
                <Mic size={32} className="text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-zinc-300">Tap to Record</p>
                <p className="text-xs text-zinc-500 mt-1">Your browser will ask for microphone permission</p>
              </div>
              <button
                onClick={startRecording}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <Mic size={16} /> Start Recording
              </button>
            </>
          )}

          {error && (
            <div className="w-full p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-300 text-xs text-center">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Voice Notes List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {voiceNotes.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Volume2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No voice notes yet. Record one above!</p>
          </div>
        ) : (
          voiceNotes.map(note => (
            <div key={note.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-all">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0">
                {(note.senderName || note.senderEmail || "?").charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{note.senderName || note.senderEmail}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Clock size={10}/> {new Date(note.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  {note.duration && <span>{formatTime(note.duration)}</span>}
                  {note.size && <span>{note.size} KB</span>}
                </div>
              </div>

              {/* Play Button */}
              {note.audioData && (
                <button
                  onClick={() => togglePlay(note.id, note.audioData)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                    playingId === note.id
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {playingId === note.id ? <Pause size={18} /> : <Play size={18} />}
                </button>
              )}

              {/* Delete Button (only own notes) */}
              {note.senderEmail === currentUser?.email && (
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-rose-400 hover:bg-rose-950/20 transition-all shrink-0 cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
