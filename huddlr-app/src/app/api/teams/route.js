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
      teams.push({ id: docSnap.id, ...docSnap.data() });
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
      createdBy: user.email,
      creatorEmail: user.email,
      ownerId: user.email,
      members: [user.email],
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
    const { teamId, name, memberToRemove, leave } = body;

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    const teamRef = doc(null, "teams", teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const teamData = teamSnap.data();

    // 1. Leave Team action
    if (leave) {
      if (teamData.owner === user.email) {
        return NextResponse.json({ error: "As owner, you cannot leave the team. You must delegate ownership or delete the team." }, { status: 400 });
      }
      
      const updatedMembers = teamData.members.filter(m => m !== user.email);
      await setDoc(teamRef, {
        ...teamData,
        members: updatedMembers
      });
      return NextResponse.json({ success: true, message: "Successfully left the team" });
    }

    // 2. Remove Member action
    if (memberToRemove) {
      if (teamData.owner !== user.email) {
        return NextResponse.json({ error: "Only the team owner can remove members" }, { status: 403 });
      }
      if (memberToRemove === teamData.owner) {
        return NextResponse.json({ error: "You cannot remove yourself from the team" }, { status: 400 });
      }

      const updatedMembers = teamData.members.filter(m => m !== memberToRemove);
      await setDoc(teamRef, {
        ...teamData,
        members: updatedMembers
      });
      return NextResponse.json({ success: true, message: `Successfully removed ${memberToRemove}`, members: updatedMembers });
    }

    // 3. Rename Team action
    if (name) {
      if (teamData.owner !== user.email) {
        return NextResponse.json({ error: "Only the team owner can rename the team" }, { status: 403 });
      }
      if (!name.trim()) {
        return NextResponse.json({ error: "Team name cannot be empty" }, { status: 400 });
      }

      const updatedName = name.trim();
      await setDoc(teamRef, {
        ...teamData,
        name: updatedName
      });
      return NextResponse.json({ success: true, message: "Team renamed successfully", name: updatedName });
    }

    return NextResponse.json({ error: "No valid action provided" }, { status: 400 });
  } catch (error) {
    console.error("Modify team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

