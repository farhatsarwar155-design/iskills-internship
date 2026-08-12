import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { getAnalyticsOverview, getAISummary } from '../controllers/analytics.controller';

const router = express.Router();

router.get('/overview', authenticateJWT, getAnalyticsOverview);
router.get('/ai-summary', authenticateJWT, getAISummary);

export default router;
