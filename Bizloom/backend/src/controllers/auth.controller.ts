import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAction } from '../utils/logger';
import { sendOTPEmail } from '../utils/email';

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
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email address already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Hard-coded role protection: All public self-registrations MUST be EMPLOYEE role only.
    // Client role payloads are ignored to prevent unauthorized privilege escalation.
    const userRole = 'EMPLOYEE';

    // Generate 6-digit OTP code and 10 minute expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        role: userRole,
        isVerified: false,
        otp,
        otpExpiresAt,
      },
    });

    // Send transactional email (logs code to console in dev mode)
    await sendOTPEmail({ to: user.email, name: user.name, otp });

    return res.status(201).json({
      message: 'Registration successful! An OTP verification code has been sent to your email.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
      mockOtp: otp, // Developer convenience
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error during registration' });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified. You can log in directly.' });
    }

    // Generate new 6-digit OTP and 10-min expiry
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: newOtp,
        otpExpiresAt: newExpiry,
      },
    });

    await sendOTPEmail({ to: user.email, name: user.name, otp: newOtp });

    return res.json({
      message: 'A new verification OTP code has been sent to your email.',
      mockOtp: newOtp,
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ message: 'Failed to resend verification OTP' });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and verification OTP are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified. You can log in directly.' });
    }

    if (!user.otp) {
      return res.status(400).json({ message: 'No active OTP found. Please request a new verification code.' });
    }

    if (user.otpExpiresAt && new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({
        message: 'This code has expired, please request a new one',
        code: 'OTP_EXPIRED',
      });
    }

    if (user.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP, please try again' });
    }

    // Mark as verified and invalidate/delete single-use OTP fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
      },
    });

    await logAction({
      userId: user.id,
      userEmail: user.email,
      action: 'VERIFY_EMAIL',
      module: 'AUTH',
      description: `Email ${user.email} verified successfully via OTP`,
      severity: 'INFO',
    });

    console.log(`✅ [OTP Verified] Account ${email} has been successfully activated.`);

    return res.json({ message: 'Email verified! Please log in.' });
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
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      await logAction({ userEmail: email, action: 'FAILED_LOGIN', module: 'AUTH', description: 'Invalid email', ipAddress, severity: 'WARNING' });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAction({ userId: user.id, userEmail: email, action: 'FAILED_LOGIN', module: 'AUTH', description: 'Invalid password', ipAddress, severity: 'WARNING' });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check verification status: pending_verification accounts CANNOT log in
    if (!user.isVerified) {
      let currentOtp = user.otp;
      if (!currentOtp || (user.otpExpiresAt && new Date() > new Date(user.otpExpiresAt))) {
        currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: { otp: currentOtp, otpExpiresAt: expiresAt },
        });
        await sendOTPEmail({ to: user.email, name: user.name, otp: currentOtp });
      }
      return res.status(403).json({
        message: 'Please verify your email before logging in',
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

// ── ADMIN USER MANAGEMENT CONTROLLERS ─────────────────────────────────────

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Failed to fetch user list' });
  }
};

export const adminCreateUser = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: 'Email, password, name, and role are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const validRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT'];
    const userRole = validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'EMPLOYEE';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole,
        isVerified: true, // Admin created users are pre-verified
      },
      select: { id: true, email: true, name: true, role: true, isVerified: true, createdAt: true }
    });

    await logAction({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'CREATE_USER',
      module: 'USER_MANAGEMENT',
      description: `Created new user ${user.email} with role [${user.role}]`,
      ipAddress: req.ip,
      severity: 'INFO'
    });

    return res.status(201).json({ message: 'User account created successfully', user });
  } catch (error) {
    console.error('Admin create user error:', error);
    return res.status(500).json({ message: 'Failed to create user account' });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role, isVerified } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const updateData: any = {};
    if (role) {
      const validRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT'];
      if (!validRoles.includes(role.toUpperCase())) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }
      updateData.role = role.toUpperCase();
    }
    if (typeof isVerified === 'boolean') {
      updateData.isVerified = isVerified;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, isVerified: true }
    });

    const isRoleChanged = existingUser.role !== user.role;

    await logAction({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: isRoleChanged ? 'ROLE_PROMOTION' : 'UPDATE_USER',
      module: 'USER_MANAGEMENT',
      description: isRoleChanged
        ? `Role changed for user ${user.email} from [${existingUser.role}] to [${user.role}] (Active: ${user.isVerified})`
        : `Updated status for user ${user.email} to (Active: ${user.isVerified})`,
      ipAddress: req.ip,
      severity: 'WARNING'
    });

    return res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ message: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    if (id === req.user?.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    const user = await prisma.user.delete({ where: { id } });

    await logAction({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'DELETE_USER',
      module: 'USER_MANAGEMENT',
      description: `Deleted user account ${user.email}`,
      ipAddress: req.ip,
      severity: 'WARNING'
    });

    return res.json({ message: 'User account deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Failed to delete user account' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(404).json({ message: 'User account with this email address does not exist' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiresAt },
    });

    await sendOTPEmail({ to: user.email, name: user.name, otp });

    await logAction({
      userId: user.id,
      userEmail: user.email,
      action: 'FORGOT_PASSWORD_REQUEST',
      module: 'AUTH',
      description: `Requested password reset OTP for ${user.email}`,
      ipAddress: req.ip,
      severity: 'INFO',
    });

    return res.json({
      message: 'Password reset OTP verification code has been sent to your email.',
      mockOtp: otp,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Failed to request password reset' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (!user.otp) {
      return res.status(400).json({ message: 'No active password reset request found. Please request a new code.' });
    }

    if (user.otpExpiresAt && new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({
        message: 'This code has expired, please request a new one',
        code: 'OTP_EXPIRED',
      });
    }

    if (user.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP, please try again' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
      },
    });

    await logAction({
      userId: user.id,
      userEmail: user.email,
      action: 'RESET_PASSWORD',
      module: 'AUTH',
      description: `Password reset successfully for user ${user.email}`,
      ipAddress: req.ip,
      severity: 'WARNING',
    });

    console.log(`✅ [Password Reset] Password updated successfully for ${email}`);

    return res.json({ message: 'Password reset successful! Please log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};
