import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from "@/lib/firebase";

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
    const messagesSnap = await getDocs(collection(null, "messages"));
    const docsSnap = await getDocs(collection(null, "documents"));
    const voiceSnap = await getDocs(collection(null, "voiceNotes"));

    const teams = [];
    teamsSnap.forEach(tDoc => {
      teams.push({ id: tDoc.id, ...tDoc.data() });
    });

    const userStats = {};
    messagesSnap.forEach(d => {
      const email = d.data().senderEmail || d.data().sender;
      if (email) {
        if (!userStats[email]) userStats[email] = { messages: 0, documents: 0, voiceNotes: 0 };
        userStats[email].messages++;
      }
    });
    docsSnap.forEach(d => {
      const email = d.data().uploadedBy;
      if (email) {
        if (!userStats[email]) userStats[email] = { messages: 0, documents: 0, voiceNotes: 0 };
        userStats[email].documents++;
      }
    });
    voiceSnap.forEach(d => {
      const email = d.data().recordedBy || d.data().createdBy;
      if (email) {
        if (!userStats[email]) userStats[email] = { messages: 0, documents: 0, voiceNotes: 0 };
        userStats[email].voiceNotes++;
      }
    });

    const users = [];
    usersSnap.forEach(uDoc => {
      const u = uDoc.data();
      const email = u.email || uDoc.id;
      const userTeams = teams
        .filter((t) => Array.isArray(t.members) && t.members.includes(email))
        .map((t) => t.name);

      const stats = userStats[email] || { messages: 0, documents: 0, voiceNotes: 0 };

      users.push({
        id: email,
        name: u.name,
        email,
        role: u.role || "member",
        isBanned: u.isBanned || false,
        teams: userTeams,
        createdAt: u.createdAt || null,
        stats
      });
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const admin = auth.admin;

    const { action, email, role, isBanned } = await request.json();

    if (action === "changeRole") {
      const userDocRef = doc(null, "users", email);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      await updateDoc(userDocRef, { role });
      return NextResponse.json({ success: true, message: `${email} is now ${role}` });
    }

    if (action === "toggleBan") {
      if (email === admin.email) {
        return NextResponse.json({ error: "Cannot ban yourself" }, { status: 400 });
      }
      const userDocRef = doc(null, "users", email);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const newBanStatus = isBanned !== undefined ? isBanned : !userDoc.data().isBanned;
      await updateDoc(userDocRef, { isBanned: newBanStatus });
      return NextResponse.json({
        success: true,
        message: `${email} has been ${newBanStatus ? "suspended" : "activated"}`
      });
    }

    if (action === "removeUser") {
      if (email === admin.email) {
        return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
      }
      const userDocRef = doc(null, "users", email);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      await deleteDoc(userDocRef);

      // Remove from teams
      const teamsSnap = await getDocs(collection(null, "teams"));
      teamsSnap.forEach(async (tDoc) => {
        const teamData = tDoc.data();
        if (Array.isArray(teamData.members) && teamData.members.includes(email)) {
          const newMembers = teamData.members.filter(m => m !== email);
          await updateDoc(doc(null, "teams", tDoc.id), { members: newMembers });
        }
      });

      return NextResponse.json({ success: true, message: "User removed" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin users POST error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
