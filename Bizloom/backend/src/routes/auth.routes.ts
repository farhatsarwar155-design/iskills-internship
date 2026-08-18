import { Router } from 'express';
import { register, verifyOTP, resendOTP, login, forgotPassword, resetPassword, refresh, logout, me, getUsers, adminCreateUser, updateUserRole, deleteUser } from '../controllers/auth.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticateJWT, me);

// Admin User Management Routes
router.get('/users', authenticateJWT, requireRoles(['ADMIN']), getUsers);
router.post('/users', authenticateJWT, requireRoles(['ADMIN']), adminCreateUser);
router.patch('/users/:id', authenticateJWT, requireRoles(['ADMIN']), updateUserRole);
router.delete('/users/:id', authenticateJWT, requireRoles(['ADMIN']), deleteUser);

export default router;
