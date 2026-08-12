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
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticateJWT);

// Supplier routes
router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// Purchase Order routes
router.get('/orders', getPurchaseOrders);
router.post('/orders', createPurchaseOrder);
router.patch('/orders/:id/receive', receivePurchaseOrder);

export default router;
