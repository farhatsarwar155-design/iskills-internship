import express from 'express';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { getDashboardData, getSalesForecast, getSystemLogs, getBusinessHealthScore, getDashboardWidgets } from '../controllers/dashboard.controller';

const router = express.Router();

router.get('/', authenticateJWT, getDashboardData);
router.get('/forecast', authenticateJWT, requireRoles(['ADMIN', 'ACCOUNTANT']), getSalesForecast);
router.get('/health', authenticateJWT, getBusinessHealthScore);
router.get('/widgets', authenticateJWT, getDashboardWidgets);
router.get('/logs', authenticateJWT, requireRoles(['ADMIN']), getSystemLogs);

export default router;
