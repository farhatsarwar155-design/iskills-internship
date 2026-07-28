import { verifyJWT, comparePassword, hashPassword } from "@/lib/auth";
import { doc, getDoc, setDoc } from "@/lib/firebase";
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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 });
    }

    // Fetch user details from database
    const userDocRef = doc(null, "users", user.email);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDocSnap.data();

    // Verify current password
    const isMatch = await comparePassword(currentPassword, userData.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    }

    // Hash new password and save
    const newHashedPassword = await hashPassword(newPassword);
    await setDoc(userDocRef, {
      ...userData,
      password: newHashedPassword
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
