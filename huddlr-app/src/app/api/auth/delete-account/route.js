import { verifyJWT } from "@/lib/auth";
import { doc, getDoc, deleteDoc } from "@/lib/firebase";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return await verifyJWT(token);
  } catch (err) {
    return null;
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDocRef = doc(null, "users", user.email);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user document
    await deleteDoc(userDocRef);

    // Delete token cookie to log them out
    const cookieStore = await cookies();
    cookieStore.delete("token");

    return NextResponse.json({ success: true, message: "Account successfully deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
