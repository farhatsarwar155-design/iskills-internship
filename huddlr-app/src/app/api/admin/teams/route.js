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

    const teamsSnap = await getDocs(collection(null, "teams"));
    const teams = [];
    teamsSnap.forEach(tDoc => {
      const t = tDoc.data();
      teams.push({
        id: tDoc.id,
        name: t.name,
        createdBy: t.createdBy || "—",
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
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const admin = auth.admin;

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
