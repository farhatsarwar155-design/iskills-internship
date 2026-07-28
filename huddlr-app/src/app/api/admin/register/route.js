import nodemailer from "nodemailer";
import { doc, getDoc, setDoc } from "@/lib/firebase";
import { hashPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, email, password, inviteCode } = await request.json();

    if (!name || !email || !password || !inviteCode) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Validate invite code
    const expectedCode = process.env.ADMIN_INVITE_CODE;
    if (!expectedCode || inviteCode.trim() !== expectedCode.trim()) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 403 });
    }

    // Email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Password length check
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if user already exists
    const userDocRef = doc(null, "users", email);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save registration info and OTP to the otps collection with role: "admin"
    const otpDocRef = doc(null, "otps", email);
    await setDoc(otpDocRef, {
      name,
      email,
      hashedPassword,
      otp,
      expiresAt,
      role: "admin"
    });

    console.log(`[AUTH ADMIN] Generated OTP for ${email}: ${otp}`);

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.warn("[AUTH ADMIN] Nodemailer env variables EMAIL_USER or EMAIL_PASS are missing. OTP is:", otp);
      return NextResponse.json({ 
        success: true, 
        message: "Email credentials missing. Falling back to dev mode.",
        email,
        devOtp: otp
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: emailUser, pass: emailPass }
      });

      const mailOptions = {
        from: `"Huddlr Admin" <${emailUser}>`,
        to: email,
        subject: "Huddlr Admin Verification Code",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4F46E5; text-align: center;">Huddlr Admin Verification</h2>
            <p>Hello ${name},</p>
            <p>You are registering an admin account. Use the 6-digit OTP below to verify your admin privileges. Valid for 10 minutes:</p>
            <div style="background: #F3F4F6; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; color: #111827; margin: 20px 0;">
              ${otp}
            </div>
            <p>If you didn't request this code, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #9CA3AF; text-align: center;">Huddlr Admin Panel</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (sendError) {
      console.error("[AUTH ADMIN] Nodemailer send error:", sendError);
      return NextResponse.json({ 
        success: true, 
        message: "Failed to send email. Falling back to dev mode.",
        email,
        devOtp: otp
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Admin OTP sent successfully to email",
      email 
    });
  } catch (error) {
    console.error("Admin Register error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
