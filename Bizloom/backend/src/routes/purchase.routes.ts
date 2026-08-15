import { Router } from 'express';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
} from '../controllers/purchase.controller';
import { authenticateJWT, requireRoles, auditLogger } from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticateJWT);
router.use(auditLogger('PURCHASE'));

// Supplier routes
router.get('/suppliers', requireRoles(['ADMIN', 'MANAGER', 'ACCOUNTANT']), getSuppliers);
router.post('/suppliers', requireRoles(['ADMIN', 'MANAGER']), createSupplier);
router.put('/suppliers/:id', requireRoles(['ADMIN', 'MANAGER']), updateSupplier);
router.delete('/suppliers/:id', requireRoles(['ADMIN', 'MANAGER']), deleteSupplier);

// Purchase Order routes
router.get('/orders', requireRoles(['ADMIN', 'MANAGER', 'ACCOUNTANT']), getPurchaseOrders);
router.post('/orders', requireRoles(['ADMIN', 'MANAGER', 'ACCOUNTANT']), createPurchaseOrder);
router.patch('/orders/:id/receive', requireRoles(['ADMIN', 'MANAGER']), receivePurchaseOrder);

export default router;
