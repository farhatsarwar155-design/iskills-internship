import { doc, getDoc, setDoc, deleteDoc } from "@/lib/firebase";
import { signJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const otpDocRef = doc(null, "otps", email);
    const otpDocSnap = await getDoc(otpDocRef);

    if (!otpDocSnap.exists()) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    const otpData = otpDocSnap.data();

    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      await deleteDoc(otpDocRef);
      return NextResponse.json({ error: "Verification code has expired. Please register again." }, { status: 400 });
    }

    // Check match
    if (otpData.otp !== otp) {
      return NextResponse.json({ error: "Incorrect verification code" }, { status: 400 });
    }

    // Create user in users collection
    const userDocRef = doc(null, "users", email);
    await setDoc(userDocRef, {
      name: otpData.name,
      email: otpData.email,
      password: otpData.hashedPassword,
      role: otpData.role || "member",
      createdAt: Date.now()
    });

    // Delete OTP record
    await deleteDoc(otpDocRef);

    // Sign JWT session token
    const token = await signJWT({
      name: otpData.name,
      email: otpData.email,
      role: otpData.role || "member"
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
      message: "Account verified successfully",
      user: {
        name: otpData.name,
        email: otpData.email,
        role: otpData.role || "member"
      }
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
