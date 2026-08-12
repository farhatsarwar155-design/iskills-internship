import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAction } from '../utils/logger';

const accessSecret = process.env.JWT_ACCESS_SECRET || 'default_access_secret_key_123_change_in_production';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key_456_change_in_production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const validRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT'];
    const userRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : 'EMPLOYEE';

    // Generate 6-digit OTP code and 10 minute expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole,
        isVerified: false,
        otp,
        otpExpiresAt,
      },
    });

    console.log(`\n==================================================`);
    console.log(`🔑 [VERIFICATION OTP] User: ${email} | Code: ${otp}`);
    console.log(`==================================================\n`);

    return res.status(201).json({
      message: 'Registration successful! An OTP code has been sent for email verification.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
      mockOtp: otp, // Included for easy developer testing in UI
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error during registration' });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and verification OTP are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified. You can sign in directly.' });
    }

    if (!user.otp || user.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid verification OTP code. Please check and try again.' });
    }

    if (user.otpExpiresAt && new Date() > new Date(user.otpExpiresAt)) {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { otp: newOtp, otpExpiresAt: newExpiry },
      });
      console.log(`[OTP Verification Expired] Generated new code for ${email}: ${newOtp}`);
      return res.status(400).json({
        message: 'Verification code expired. A new code has been generated.',
        mockOtp: newOtp,
      });
    }

    // Mark as verified and clear OTP fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
      },
    });

    console.log(`✅ [OTP Verified] Account ${email} has been successfully verified.`);

    return res.json({ message: 'Account verified successfully! You can now log in.' });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ message: 'Internal server error during OTP verification' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ipAddress = req.ip;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await logAction({ userEmail: email, action: 'FAILED_LOGIN', module: 'AUTH', description: 'Invalid email', ipAddress, severity: 'WARNING' });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAction({ userId: user.id, userEmail: email, action: 'FAILED_LOGIN', module: 'AUTH', description: 'Invalid password', ipAddress, severity: 'WARNING' });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check verification status
    if (!user.isVerified) {
      let currentOtp = user.otp;
      if (!currentOtp) {
        currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: { otp: currentOtp, otpExpiresAt: expiresAt },
        });
      }
      return res.status(403).json({
        message: 'Your account is not verified yet. Please complete OTP verification.',
        code: 'EMAIL_UNVERIFIED',
        email: user.email,
        mockOtp: currentOtp,
      });
    }

    // Generate tokens
    const userPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = jwt.sign(userPayload, accessSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, refreshSecret, { expiresIn: '7d' });

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await logAction({ userId: user.id, userEmail: email, action: 'LOGIN', module: 'AUTH', description: 'Successful login', ipAddress, severity: 'INFO' });

    // Set HTTP-Only Cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.json({
      message: 'Login successful',
      token: accessToken,
      user: userPayload,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  try {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      return res.status(403).json({ message: 'Invalid or revoked refresh token' });
    }

    if (new Date() > tokenRecord.expiresAt) {
      // Clean up expired token
      await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      return res.status(403).json({ message: 'Refresh token expired' });
    }

    // Verify token structure/signature
    const decoded = jwt.verify(refreshToken, refreshSecret) as { id: string };
    if (decoded.id !== tokenRecord.userId) {
      return res.status(403).json({ message: 'Invalid token user mismatch' });
    }

    // Generate new Access Token
    const user = tokenRecord.user;
    const userPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const newAccessToken = jwt.sign(userPayload, accessSecret, { expiresIn: '15m' });

    return res.json({
      token: newAccessToken,
      user: userPayload,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(403).json({ message: 'Invalid refresh token signature' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  try {
    if (refreshToken) {
      // Remove from database
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    // Clear client-side cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error during logout' });
  }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true, lastLogin: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User no longer exists' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get user info error:', error);
    return res.status(500).json({ message: 'Internal server error retrieving user profile' });
  }
};
