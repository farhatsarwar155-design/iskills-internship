import { Router } from 'express';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getOrders,
  createOrder,
  updateOrderStatus,
} from '../controllers/sales.controller';
import { authenticateJWT, requireRoles, auditLogger } from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticateJWT);
router.use(auditLogger('SALES'));

// Customer routes
router.get('/customers', requireRoles(['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT']), getCustomers);
router.post('/customers', requireRoles(['ADMIN', 'MANAGER']), createCustomer);
router.put('/customers/:id', requireRoles(['ADMIN', 'MANAGER']), updateCustomer);
router.delete('/customers/:id', requireRoles(['ADMIN', 'MANAGER']), deleteCustomer);

// Order routes
router.get('/orders', requireRoles(['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT']), getOrders);
router.post('/orders', requireRoles(['ADMIN', 'MANAGER', 'EMPLOYEE']), createOrder);
router.patch('/orders/:id/status', requireRoles(['ADMIN', 'MANAGER']), updateOrderStatus);

export default router;

