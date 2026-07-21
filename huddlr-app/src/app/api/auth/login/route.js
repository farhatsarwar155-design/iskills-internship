import { doc, getDoc } from "@/lib/firebase";
import { comparePassword, signJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const userDocRef = doc(null, "users", email);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const userData = userDocSnap.data();

    // Verify password
    const isMatch = await comparePassword(password, userData.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    // Sign JWT session token
    const token = await signJWT({
      name: userData.name,
      email: userData.email
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 2 // 2 hours
    });

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        name: userData.name,
        email: userData.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
