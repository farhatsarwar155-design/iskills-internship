import { doc, getDoc, setDoc } from "@/lib/firebase";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, email } = await request.json();
    if (!teamId || !email || !email.trim()) {
      return NextResponse.json({ error: "Team ID and email are required" }, { status: 400 });
    }

    const inviteeEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteeEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const teamRef = doc(null, "teams", teamId);
    const teamSnap = await getDoc(teamRef);

    if (!teamSnap.exists()) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const teamData = teamSnap.data();

    // Check if current user is member of this team
    if (!teamData.members.includes(user.email)) {
      return NextResponse.json({ error: "You are not authorized to invite members to this team" }, { status: 403 });
    }

    // Check if invitee is already a member
    if (teamData.members.includes(inviteeEmail)) {
      return NextResponse.json({ error: "User is already a member of this team" }, { status: 400 });
    }

    // Add member
    const updatedMembers = [...teamData.members, inviteeEmail];
    await setDoc(teamRef, {
      ...teamData,
      members: updatedMembers
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully invited ${inviteeEmail} to ${teamData.name}`,
      members: updatedMembers
    });
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
