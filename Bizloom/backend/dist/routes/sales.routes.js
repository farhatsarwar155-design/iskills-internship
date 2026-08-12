"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sales_controller_1 = require("../controllers/sales.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protect all routes
router.use(auth_1.authenticateJWT);
// Customer routes
router.get('/customers', sales_controller_1.getCustomers);
router.post('/customers', sales_controller_1.createCustomer);
router.put('/customers/:id', sales_controller_1.updateCustomer);
router.delete('/customers/:id', sales_controller_1.deleteCustomer);
// Order routes
router.get('/orders', sales_controller_1.getOrders);
router.post('/orders', sales_controller_1.createOrder);
exports.default = router;
