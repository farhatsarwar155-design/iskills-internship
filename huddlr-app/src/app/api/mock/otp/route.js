import { NextResponse } from "next/server";
import { isMock, doc, getDoc } from "@/lib/firebase";

export async function GET(request) {
  if (!isMock) {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const otpDocRef = doc(null, "otps", email);
  const otpDocSnap = await getDoc(otpDocRef);

  if (otpDocSnap.exists()) {
    const data = otpDocSnap.data();
    return NextResponse.json({ otp: data.otp });
  }

  return NextResponse.json({ error: "No active OTP found" }, { status: 404 });
}
