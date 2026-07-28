import { verifyJWT } from "@/lib/auth";
import { doc, getDoc } from "@/lib/firebase";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false, error: "Invalid session token" }, { status: 401 });
    }

    // Fetch latest user data from DB to get the current role
    const userDocRef = doc(null, "users", payload.email);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.exists() ? userDocSnap.data() : {};

    // Check if user is banned
    if (userData.isBanned) {
      const response = NextResponse.json({ authenticated: false, error: "Your account has been suspended" }, { status: 403 });
      response.cookies.set("token", "", { maxAge: 0, path: "/" });
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        name: userData.name || payload.name,
        email: payload.email,
        role: userData.role || "member",
        profilePicture: userData.profilePicture || null,
        bio: userData.bio || "",
        notifications: userData.notifications || {},
        theme: userData.theme || "dark"
      }
    });
  } catch (error) {
    console.error("Auth me check error:", error);
    return NextResponse.json({ authenticated: false, error: "Internal server error" }, { status: 500 });
  }
}
