import { collection, doc, addDoc, getDocs, query, where } from "@/lib/firebase";
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
