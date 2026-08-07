"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const accessSecret = process.env.JWT_ACCESS_SECRET || 'default_access_secret_key_123_change_in_production';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key_456_change_in_production';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
const register = async (req, res) => {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
    }
    try {
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const validRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT'];
        const userRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : 'EMPLOYEE';
        const user = await db_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: userRole,
            },
        });
        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error during registration' });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        // Generate tokens
        const userPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
        const accessToken = jsonwebtoken_1.default.sign(userPayload, accessSecret, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, refreshSecret, { expiresIn: '7d' });
        // Save refresh token to database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await db_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });
        // Set HTTP-Only Cookie
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
        return res.json({
            message: 'Login successful',
            token: accessToken,
            user: userPayload,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error during login' });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token missing' });
    }
    try {
        const tokenRecord = await db_1.default.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!tokenRecord) {
            return res.status(403).json({ message: 'Invalid or revoked refresh token' });
        }
        if (new Date() > tokenRecord.expiresAt) {
            // Clean up expired token
            await db_1.default.refreshToken.delete({ where: { id: tokenRecord.id } });
            return res.status(403).json({ message: 'Refresh token expired' });
        }
        // Verify token structure/signature
        const decoded = jsonwebtoken_1.default.verify(refreshToken, refreshSecret);
        if (decoded.id !== tokenRecord.userId) {
            return res.status(403).json({ message: 'Invalid token user mismatch' });
        }
        // Generate new Access Token
        const user = tokenRecord.user;
        const userPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
        const newAccessToken = jsonwebtoken_1.default.sign(userPayload, accessSecret, { expiresIn: '15m' });
        return res.json({
            token: newAccessToken,
            user: userPayload,
        });
    }
    catch (error) {
        console.error('Refresh error:', error);
        return res.status(403).json({ message: 'Invalid refresh token signature' });
    }
};
exports.refresh = refresh;
const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    try {
        if (refreshToken) {
            // Remove from database
            await db_1.default.refreshToken.deleteMany({ where: { token: refreshToken } });
        }
        // Clear client-side cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
        return res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Internal server error during logout' });
    }
};
exports.logout = logout;
const me = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        if (!user) {
            return res.status(404).json({ message: 'User no longer exists' });
        }
        return res.json({ user });
    }
    catch (error) {
        console.error('Get user info error:', error);
        return res.status(500).json({ message: 'Internal server error retrieving user profile' });
    }
};
exports.me = me;
