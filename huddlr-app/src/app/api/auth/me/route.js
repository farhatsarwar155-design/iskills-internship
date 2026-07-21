import { verifyJWT } from "@/lib/auth";
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

    return NextResponse.json({
      authenticated: true,
      user: {
        name: payload.name,
        email: payload.email
      }
    });
  } catch (error) {
    console.error("Auth me check error:", error);
    return NextResponse.json({ authenticated: false, error: "Internal server error" }, { status: 500 });
  }
}
