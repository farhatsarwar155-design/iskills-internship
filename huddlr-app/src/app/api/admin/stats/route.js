import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { collection, getDocs, doc, getDoc } from "@/lib/firebase";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return { error: "Unauthorized", status: 401 };
  const payload = await verifyJWT(token);
  if (!payload) return { error: "Unauthorized", status: 401 };
  
  const userDocRef = doc(null, "users", payload.email);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) return { error: "Forbidden: User not found", status: 403 };
  const userData = userDocSnap.data();
  if (userData.role !== "admin") return { error: "Forbidden: Admin access required", status: 403 };
  return { admin: userData };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const admin = auth.admin;

    const usersSnap = await getDocs(collection(null, "users"));
    const teamsSnap = await getDocs(collection(null, "teams"));
    const meetingsSnap = await getDocs(collection(null, "meetings"));
    const tasksSnap = await getDocs(collection(null, "tasks"));
    const messagesSnap = await getDocs(collection(null, "messages"));
    const docsSnap = await getDocs(collection(null, "documents"));
    const voiceSnap = await getDocs(collection(null, "voiceNotes"));

    const teamStats = {};
    docsSnap.forEach(d => {
      const tId = d.data().teamId;
      if (tId) {
        if (!teamStats[tId]) teamStats[tId] = { documents: 0, voiceNotes: 0 };
        teamStats[tId].documents++;
      }
    });
    voiceSnap.forEach(d => {
      const tId = d.data().teamId;
      if (tId) {
        if (!teamStats[tId]) teamStats[tId] = { documents: 0, voiceNotes: 0 };
        teamStats[tId].voiceNotes++;
      }
    });

    const users = [];
    usersSnap.forEach(d => users.push({ id: d.id, ...d.data() }));
    
    const teams = [];
    teamsSnap.forEach(d => teams.push({ id: d.id, ...d.data() }));
    
    const meetings = [];
    meetingsSnap.forEach(d => meetings.push({ id: d.id, ...d.data() }));
    
    const tasks = [];
    tasksSnap.forEach(d => tasks.push({ id: d.id, ...d.data() }));

    // User email to name mapping
    const emailToName = {};
    users.forEach(u => {
      if (u.email) {
        emailToName[u.email.toLowerCase()] = u.name || u.email;
      }
    });

    const getDisplayName = (email) => {
      if (!email) return "System";
      return emailToName[email.toLowerCase()] || email;
    };

    // Construct events
    const events = [];

    // 1. User registration events
    users.forEach(u => {
      if (u.createdAt) {
        events.push({
          id: `user-${u.id}-${u.createdAt}`,
          type: "user",
          targetId: u.email || u.id,
          targetType: "user",
          userName: u.name || u.email,
          action: "registered a new account",
          timestamp: u.createdAt
        });
      }
    });

    // 2. Team creation events
    teams.forEach(t => {
      if (t.createdAt) {
        events.push({
          id: `team-${t.id}-${t.createdAt}`,
          type: "team",
          targetId: t.id,
          targetType: "team",
          userName: getDisplayName(t.owner || t.createdBy),
          action: `created team "${t.name}"`,
          timestamp: t.createdAt
        });
      }
    });

    // 3. Meeting scheduling events
    meetings.forEach(m => {
      const ts = m.createdAt || m.timestamp;
      if (ts) {
        events.push({
          id: `meeting-${m.id}-${ts}`,
          type: "meeting",
          targetId: m.id,
          targetType: "meeting",
          userName: getDisplayName(m.createdBy || m.hostId),
          action: `scheduled meeting "${m.title}"`,
          timestamp: ts
        });
      }
    });

    // 4. Task creation events
    tasks.forEach(t => {
      if (t.createdAt) {
        events.push({
          id: `task-${t.id}-${t.createdAt}`,
          type: "task",
          targetId: t.id,
          targetType: "task",
          userName: getDisplayName(t.createdBy),
          action: `created task "${t.title}"`,
          timestamp: t.createdAt
        });
      }
    });

    // 5. Message events
    messagesSnap.forEach(d => {
      const msg = d.data();
      const ts = msg.timestamp || msg.createdAt;
      if (ts) {
        events.push({
          id: `msg-${d.id}-${ts}`,
          type: "user",
          targetId: msg.teamId || d.id,
          targetType: "team",
          userName: getDisplayName(msg.senderEmail || msg.sender),
          action: "sent a message in Team Chat",
          timestamp: ts
        });
      }
    });

    // 6. Document events
    docsSnap.forEach(d => {
      const docData = d.data();
      const ts = docData.uploadedAt || docData.createdAt;
      if (ts) {
        events.push({
          id: `doc-${d.id}-${ts}`,
          type: "user",
          targetId: d.id,
          targetType: "document",
          userName: getDisplayName(docData.uploadedBy),
          action: "uploaded a document",
          timestamp: ts
        });
      }
    });

    // 7. Voice note events
    voiceSnap.forEach(d => {
      const v = d.data();
      const ts = v.createdAt || v.timestamp;
      if (ts) {
        events.push({
          id: `voice-${d.id}-${ts}`,
          type: "user",
          targetId: d.id,
          targetType: "voicenote",
          userName: getDisplayName(v.recordedBy || v.createdBy),
          action: "shared a voice note",
          timestamp: ts
        });
      }
    });

    // Sort by timestamp descending and take the latest 15
    const recentActivity = events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15);

    return NextResponse.json({
      totalUsers: users.length,
      totalTeams: teams.length,
      totalMeetings: meetings.length,
      totalTasks: tasks.length,
      users: users.map(u => ({
        id: u.id || u.email,
        name: u.name || u.email,
        email: u.email,
        createdAt: u.createdAt || Date.now(),
        role: u.role || "member",
        isBanned: u.isBanned || false
      })),
      meetings: meetings.map(m => ({
        id: m.id,
        title: m.title || "Untitled Meeting",
        host: getDisplayName(m.createdBy || m.hostId),
        hostId: m.hostId || m.createdBy,
        createdBy: m.createdBy,
        date: m.date || "N/A",
        time: m.time || "N/A",
        duration: m.duration || 30,
        teamId: m.teamId,
        timestamp: m.timestamp || m.createdAt || Date.now(),
        createdAt: m.createdAt || m.timestamp
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title || "Untitled Task",
        assignee: getDisplayName(t.assigneeEmail || t.assignee) || "Unassigned",
        assigneeEmail: t.assigneeEmail || t.assignee,
        status: t.status || "todo",
        priority: t.priority || "medium",
        teamId: t.teamId,
        createdBy: getDisplayName(t.createdBy),
        createdAt: t.createdAt || Date.now()
      })),
      teams: teams.map(t => ({
        id: t.id,
        name: t.name,
        owner: t.owner || t.createdBy,
        createdBy: getDisplayName(t.owner || t.createdBy),
        members: t.members || [],
        createdAt: t.createdAt || Date.now(),
        stats: teamStats[t.id] || { documents: 0, voiceNotes: 0 }
      })),
      recentActivity
    });
  } catch (error) {
    return NextResponse.json({ error: error.message, stack: error.stack, name: error.name }, { status: 500 });
  }
}
