import { Router } from 'express';
import { register, verifyOTP, login, refresh, logout, me } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticateJWT, me);

export default router;
