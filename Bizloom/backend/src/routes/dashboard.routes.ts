import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboard.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJWT, getDashboardData);

export default router;
