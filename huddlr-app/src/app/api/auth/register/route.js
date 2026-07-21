import nodemailer from "nodemailer";
import { doc, getDoc, setDoc } from "@/lib/firebase";
import { hashPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
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

    // Save registration info and OTP to the otps collection
    const otpDocRef = doc(null, "otps", email);
    await setDoc(otpDocRef, {
      name,
      email,
      hashedPassword,
      otp,
      expiresAt
    });

    console.log(`[AUTH] Generated OTP for ${email}: ${otp}`);

    // Send email via Nodemailer
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });

      const mailOptions = {
        from: `"Huddlr Team" <${emailUser}>`,
        to: email,
        subject: "Huddlr Verification Code",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4F46E5; text-align: center;">Huddlr Verification</h2>
            <p>Hello ${name},</p>
            <p>Thank you for registering on Huddlr. Use the 6-digit OTP below to verify your account. This code is valid for 10 minutes:</p>
            <div style="background: #F3F4F6; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; color: #111827; margin: 20px 0;">
              ${otp}
            </div>
            <p>If you didn't request this code, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #9CA3AF; text-align: center;">Huddlr Team Collaboration App</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    } else {
      console.log(`[AUTH] Nodemailer env variables not set. OTP shown in console: ${otp}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent successfully to email",
      email 
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
