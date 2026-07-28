import { collection, doc, addDoc, getDocs, query, where, getDoc, setDoc } from "@/lib/firebase";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

/** Returns the effective role of `email` in the given teamData object. */
function getMemberRole(teamData, email) {
  if (teamData.memberRoles && teamData.memberRoles[email]) {
    return teamData.memberRoles[email];
  }
  if (teamData.owner === email) return "owner";
  return "member";
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamsRef = collection(null, "teams");
    const q = query(teamsRef, where("members", "array-contains", user.email));
    const querySnapshot = await getDocs(q);

    const teams = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Back-fill memberRoles so client always has the map
      if (!data.memberRoles) {
        data.memberRoles = {};
        (data.members || []).forEach((m) => {
          data.memberRoles[m] = m === data.owner ? "owner" : "member";
        });
      }
      teams.push({ id: docSnap.id, ...data });
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Fetch teams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const teamsRef = collection(null, "teams");
    const newTeam = {
      name: name.trim(),
      owner: user.email,
      members: [user.email],
      memberRoles: { [user.email]: "owner" },
      createdAt: Date.now()
    };

    const docRef = await addDoc(teamsRef, newTeam);

    return NextResponse.json({ success: true, team: { id: docRef.id, ...newTeam } });
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, name, memberToRemove, leave, changeMemberRole } = body;

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    const teamRef = doc(null, "teams", teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const teamData = teamSnap.data();

    // Ensure memberRoles is always present (backward-compat)
    if (!teamData.memberRoles) {
      teamData.memberRoles = {};
      (teamData.members || []).forEach((m) => {
        teamData.memberRoles[m] = m === teamData.owner ? "owner" : "member";
      });
    }

    const callerRole = getMemberRole(teamData, user.email);

    // ── 1. CHANGE MEMBER ROLE ──
    if (changeMemberRole) {
      const { targetEmail, newRole } = changeMemberRole;

      if (!targetEmail || !newRole) {
        return NextResponse.json({ error: "targetEmail and newRole are required" }, { status: 400 });
      }
      if (!["co-lead", "member"].includes(newRole)) {
        return NextResponse.json({ error: "newRole must be 'co-lead' or 'member'" }, { status: 400 });
      }
      if (!teamData.members.includes(targetEmail)) {
        return NextResponse.json({ error: "Target is not a team member" }, { status: 404 });
      }

      const targetRole = getMemberRole(teamData, targetEmail);

      if (callerRole !== "owner") {
        return NextResponse.json({ error: "Only the team owner can change member roles" }, { status: 403 });
      }
      if (targetRole === "owner") {
        return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 400 });
      }

      const updatedRoles = { ...teamData.memberRoles, [targetEmail]: newRole };
      await setDoc(teamRef, { ...teamData, memberRoles: updatedRoles });

      return NextResponse.json({
        success: true,
        message: `${targetEmail} is now ${newRole}`,
        memberRoles: updatedRoles
      });
    }

    // ── 2. LEAVE TEAM ──
    if (leave) {
      if (callerRole === "owner") {
        return NextResponse.json({
          error: "As owner, you cannot leave the team. Delegate ownership or delete the team."
        }, { status: 400 });
      }

      const updatedMembers = teamData.members.filter((m) => m !== user.email);
      const updatedRoles = { ...teamData.memberRoles };
      delete updatedRoles[user.email];

      await setDoc(teamRef, { ...teamData, members: updatedMembers, memberRoles: updatedRoles });
      return NextResponse.json({ success: true, message: "Successfully left the team" });
    }

    // ── 3. REMOVE A MEMBER ──
    if (memberToRemove) {
      if (!teamData.members.includes(memberToRemove)) {
        return NextResponse.json({ error: "Member not found in team" }, { status: 404 });
      }
      if (memberToRemove === teamData.owner) {
        return NextResponse.json({ error: "Cannot remove the team owner" }, { status: 400 });
      }

      const targetRole = getMemberRole(teamData, memberToRemove);

      if (callerRole === "co-lead" && targetRole !== "member") {
        return NextResponse.json({
          error: "Co-Leads can only remove regular Members"
        }, { status: 403 });
      }
      if (callerRole === "member") {
        return NextResponse.json({ error: "You do not have permission to remove members" }, { status: 403 });
      }

      const updatedMembers = teamData.members.filter((m) => m !== memberToRemove);
      const updatedRoles = { ...teamData.memberRoles };
      delete updatedRoles[memberToRemove];

      await setDoc(teamRef, { ...teamData, members: updatedMembers, memberRoles: updatedRoles });
      return NextResponse.json({
        success: true,
        message: `Successfully removed ${memberToRemove}`,
        members: updatedMembers,
        memberRoles: updatedRoles
      });
    }

    // ── 4. RENAME TEAM ──
    if (name) {
      if (callerRole !== "owner") {
        return NextResponse.json({ error: "Only the team owner can rename the team" }, { status: 403 });
      }
      if (!name.trim()) {
        return NextResponse.json({ error: "Team name cannot be empty" }, { status: 400 });
      }

      const updatedName = name.trim();
      await setDoc(teamRef, { ...teamData, name: updatedName });
      return NextResponse.json({ success: true, message: "Team renamed successfully", name: updatedName });
    }

    return NextResponse.json({ error: "No valid action provided" }, { status: 400 });
  } catch (error) {
    console.error("Modify team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
