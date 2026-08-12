"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("../controllers/inventory.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protect all routes
router.use(auth_1.authenticateJWT);
router.get('/', inventory_controller_1.getProducts);
router.get('/:id/history', inventory_controller_1.getProductHistory);
router.post('/', inventory_controller_1.createProduct);
router.delete('/:id', inventory_controller_1.deleteProduct);
router.post('/bulk-delete', inventory_controller_1.bulkDeleteProducts);
exports.default = router;
