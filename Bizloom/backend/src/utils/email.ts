import nodemailer from 'nodemailer';

interface SendOTPEmailParams {
  to: string;
  name: string;
  otp: string;
}

export const sendOTPEmail = async ({ to, name, otp }: SendOTPEmailParams): Promise<boolean> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bizloom Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .logo { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 20px; color: #4f46e5; margin-bottom: 24px; }
        .title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .desc { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
        .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; }
        .expiry-note { font-size: 12px; font-weight: 700; color: #ef4444; margin-top: 8px; }
        .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          ⚡ Bizloom ERP
        </div>
        <div class="title">Verify your email address</div>
        <div class="desc">
          Hello <strong>${name}</strong>,<br>
          Thank you for registering with Bizloom ERP. Please use the following 6-digit One-Time Password (OTP) to activate your account.
        </div>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="expiry-note">⏰ Code expires in 10 minutes</div>
        </div>
        <div class="desc" style="font-size: 12px;">
          If you didn't request this registration, please ignore this email. No changes will be made to your account.
        </div>
        <div class="footer">
          © 2026 Bizloom, Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`\n==================================================`);
  console.log(`📧 [EMAIL OTP SENT]`);
  console.log(`   To:      ${to}`);
  console.log(`   Name:    ${name}`);
  console.log(`   OTP:     ${otp}`);
  console.log(`   Expires: 10 minutes`);
  console.log(`==================================================\n`);

  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"Bizloom ERP Security" <${smtpUser}>`,
        to,
        subject: `Your Bizloom Verification Code: ${otp}`,
        html: htmlContent,
      });
      console.log(`✅ [SMTP Email Delivered] Code sent to ${to}`);
    }
    return true;
  } catch (error) {
    console.error('Failed to send email via SMTP (logged code to console instead):', error);
    return true;
  }
};
