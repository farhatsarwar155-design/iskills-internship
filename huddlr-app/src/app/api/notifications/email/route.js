import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";

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
const getMockDbData = () => {
  const filePath = path.join(process.cwd(), ".mock-db.json");
  if (!fs.existsSync(filePath)) {
    return { users: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error("Error reading mock DB:", err);
    return { users: {} };
  }
};

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, subject, html, type } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getMockDbData();
    const targetUser = db.users[to];
    
    if (targetUser) {
      // Check user preferences
      const prefs = targetUser.notifications || {};
      const emailEnabled = prefs.emailNotifications !== false; // default true
      
      let typeEnabled = true;
      if (type === "task" && prefs.taskAssigned === false) typeEnabled = false;
      if (type === "meeting" && prefs.meetingReminders === false) typeEnabled = false;

      if (!emailEnabled || !typeEnabled) {
        console.log(`[NOTIFICATIONS] Email to ${to} skipped due to user preferences.`);
        return NextResponse.json({ success: true, message: "User opted out of this email notification" });
      }
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.warn("[NOTIFICATIONS] Nodemailer env variables EMAIL_USER or EMAIL_PASS are missing.");
      console.log(`[NOTIFICATIONS] Would have sent email to ${to}: ${subject}`);
      return NextResponse.json({ success: true, message: "Email logged to console (no credentials)" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: `"Huddlr Notifications" <${emailUser}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[NOTIFICATIONS] Successfully sent email to ${to}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTIFICATIONS] Error sending email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
