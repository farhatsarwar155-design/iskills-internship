import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getTodayStatus,
  checkIn,
  checkOut,
  getAttendanceHistory,
  generatePayslip,
} from '../controllers/hr.controller';
import { authenticateJWT, requireRoles, auditLogger } from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticateJWT);
router.use(auditLogger('HR'));

// Employee CRUD routes
router.get('/employees', requireRoles(['ADMIN', 'MANAGER', 'ACCOUNTANT']), getEmployees);
router.get('/employees/:id', requireRoles(['ADMIN', 'MANAGER', 'ACCOUNTANT']), getEmployeeById);
router.post('/employees', requireRoles(['ADMIN', 'MANAGER']), createEmployee);
router.put('/employees/:id', requireRoles(['ADMIN', 'MANAGER']), updateEmployee);
router.delete('/employees/:id', requireRoles(['ADMIN', 'MANAGER']), deleteEmployee);

// Attendance routes
router.get('/attendance/today', requireRoles(['ADMIN', 'MANAGER', 'ACCOUNTANT']), getTodayStatus);
router.post('/attendance/checkin', checkIn);
router.post('/attendance/checkout', checkOut);
router.get('/attendance/history', getAttendanceHistory);

// Payroll routes
router.post('/payroll/payslip', requireRoles(['ADMIN', 'ACCOUNTANT']), generatePayslip);

export default router;
