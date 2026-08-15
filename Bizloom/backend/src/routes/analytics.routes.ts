import express from 'express';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { getAnalyticsOverview, getAISummary } from '../controllers/analytics.controller';

const router = express.Router();

router.get('/overview', authenticateJWT, requireRoles(['ADMIN', 'ACCOUNTANT']), getAnalyticsOverview);
router.get('/ai-summary', authenticateJWT, requireRoles(['ADMIN', 'ACCOUNTANT']), getAISummary);

export default router;
