import { Router } from 'express';
import { getProducts, getProductHistory, createProduct, updateProduct, deleteProduct, bulkDeleteProducts } from '../controllers/inventory.controller';
import { authenticateJWT, requireRoles, auditLogger } from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticateJWT);
router.use(auditLogger('INVENTORY'));

router.get('/', requireRoles(['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT']), getProducts);
router.get('/:id/history', requireRoles(['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT']), getProductHistory);
router.post('/', requireRoles(['ADMIN', 'MANAGER', 'EMPLOYEE']), createProduct);
router.put('/:id', requireRoles(['ADMIN', 'MANAGER']), updateProduct);
router.delete('/:id', requireRoles(['ADMIN', 'MANAGER']), deleteProduct);
router.post('/bulk-delete', requireRoles(['ADMIN', 'MANAGER']), bulkDeleteProducts);

export default router;

