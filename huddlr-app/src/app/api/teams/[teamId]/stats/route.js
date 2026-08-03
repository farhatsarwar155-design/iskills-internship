import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function readDB() {
  const dbPath = path.join(process.cwd(), ".mock-db.json");
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { teamId } = await params;
    const db = readDB();

    // Find team
    const teams = db.teams || [];
    const team = teams.find((t) => t.id === teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify membership
    if (!team.members?.includes(payload.email)) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }

    // Gather team-scoped stats
    const allMeetings = Array.isArray(db.meetings) ? db.meetings : Object.values(db.meetings || {});
    const teamMeetings = allMeetings.filter((m) => m.teamId === teamId);
    const now = Date.now();
    const upcomingMeetings = teamMeetings.filter((m) => {
      if (!m.date) return false;
      const meetingTime = new Date(m.date).getTime();
      return meetingTime > now;
    });

    const allTasks = Array.isArray(db.tasks) ? db.tasks : Object.values(db.tasks || {});
    const teamTasks = allTasks.filter((t) => t.teamId === teamId);
    const pendingTasks = teamTasks.filter((t) => t.status !== "done" && t.status !== "completed");
    const doneTasks = teamTasks.filter((t) => t.status === "done" || t.status === "completed");

    const allDocs = Array.isArray(db.documents) ? db.documents : Object.values(db.documents || {});
    const teamDocs = allDocs.filter((d) => d.teamId === teamId);

    const allVoiceNotes = Array.isArray(db.voiceNotes) ? db.voiceNotes : Object.values(db.voiceNotes || {});
    const teamVoiceNotes = allVoiceNotes.filter((v) => v.teamId === teamId);

    const allMessages = Array.isArray(db.messages) ? db.messages : Object.values(db.messages || {});
    const teamMessages = allMessages.filter((m) => m.teamId === teamId);

    // Build recent activity from all team data
    const recentActivity = [];

    teamMeetings.forEach((m) => {
      recentActivity.push({
        id: `meeting-${m.id}`,
        type: "meeting",
        title: `Meeting "${m.title}" scheduled`,
        user: m.createdBy || m.hostId || team.owner,
        time: m.createdAt || m.date,
      });
    });

    teamTasks.forEach((t) => {
      recentActivity.push({
        id: `task-${t.id}`,
        type: "task",
        title: `Task "${t.title}" created`,
        user: t.createdBy || t.assigneeEmail || team.owner,
        time: t.createdAt,
      });
    });

    teamDocs.forEach((d) => {
      recentActivity.push({
        id: `doc-${d.id || d.name}`,
        type: "document",
        title: `Document "${d.name}" uploaded`,
        user: d.uploadedBy || team.owner,
        time: d.createdAt || d.uploadedAt,
      });
    });

    // Sort by time descending, take latest 10
    recentActivity.sort((a, b) => {
      const tA = a.time ? new Date(a.time).getTime() : 0;
      const tB = b.time ? new Date(b.time).getTime() : 0;
      return tB - tA;
    });

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        owner: team.owner,
        members: team.members || [],
        createdAt: team.createdAt,
        createdBy: team.createdBy || team.creatorEmail || team.owner,
        description: team.description || "",
      },
      stats: {
        totalMeetings: teamMeetings.length,
        upcomingMeetings: upcomingMeetings.length,
        totalTasks: teamTasks.length,
        pendingTasks: pendingTasks.length,
        doneTasks: doneTasks.length,
        totalDocuments: teamDocs.length,
        totalVoiceNotes: teamVoiceNotes.length,
        totalMessages: teamMessages.length,
        memberCount: team.members?.length || 0,
      },
      recentActivity: recentActivity.slice(0, 10),
      meetings: teamMeetings,
      tasks: teamTasks,
      documents: teamDocs,
      voiceNotes: teamVoiceNotes,
    });
  } catch (error) {
    console.error("Team stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
