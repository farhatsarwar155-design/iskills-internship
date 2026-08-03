import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from "@/lib/firebase";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload) return null;
  
  const userDocRef = doc(null, "users", payload.email);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) return null;
  const userData = userDocSnap.data();
  if (userData.role !== "admin") return null;
  return userData;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teamsSnap = await getDocs(collection(null, "teams"));
    const teams = [];
    teamsSnap.forEach(tDoc => {
      const t = tDoc.data();
      const creator = t.createdBy || t.creatorEmail || t.owner || t.ownerId || (Array.isArray(t.members) && t.members[0]) || "—";
      teams.push({
        id: tDoc.id,
        name: t.name,
        createdBy: creator,
        createdAt: t.createdAt || null,
        memberCount: Array.isArray(t.members) ? t.members.length : 0,
        members: Array.isArray(t.members) ? t.members : []
      });
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Admin teams GET error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, teamId } = await request.json();

    if (action === "deleteTeam") {
      const teamDocRef = doc(null, "teams", teamId);
      const teamDoc = await getDoc(teamDocRef);
      if (!teamDoc.exists()) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }
      await deleteDoc(teamDocRef);

      // Remove team messages
      const messagesSnap = await getDocs(collection(null, "messages"));
      messagesSnap.forEach(async (mDoc) => {
        if (mDoc.data().teamId === teamId) {
          await deleteDoc(doc(null, "messages", mDoc.id));
        }
      });

      return NextResponse.json({ success: true, message: "Team deleted" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin teams POST error:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
