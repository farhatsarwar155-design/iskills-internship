import { Router } from 'express';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getLedger,
  getProfitLossSummary,
} from '../controllers/finance.controller';
import { authenticateJWT, requireRoles, auditLogger } from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticateJWT);
router.use(auditLogger('FINANCE'));

// Transaction routes
router.get('/transactions', requireRoles(['ADMIN', 'ACCOUNTANT', 'MANAGER']), getTransactions);
router.post('/transactions', requireRoles(['ADMIN', 'ACCOUNTANT']), createTransaction);
router.delete('/transactions/:id', requireRoles(['ADMIN', 'ACCOUNTANT']), deleteTransaction);

// Ledger & Summary routes
router.get('/ledger', requireRoles(['ADMIN', 'ACCOUNTANT', 'MANAGER']), getLedger);
router.get('/summary', requireRoles(['ADMIN', 'ACCOUNTANT', 'MANAGER']), getProfitLossSummary);

export default router;
