"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = exports.getOrders = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomers = void 0;
const db_1 = __importDefault(require("../config/db"));
// ==========================================
// CUSTOMER MANAGEMENT
// ==========================================
const getCustomers = async (req, res) => {
    try {
        const { search } = req.query;
        const whereClause = {};
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }
        const customers = await db_1.default.customer.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
        });
        res.json({ customers });
    }
    catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Error retrieving customer list' });
    }
};
exports.getCustomers = getCustomers;
const createCustomer = async (req, res) => {
    try {
        const { name, email, phone, address, company } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required fields' });
        }
        const existingCustomer = await db_1.default.customer.findUnique({ where: { email } });
        if (existingCustomer) {
            return res.status(400).json({ message: 'A customer with this email already exists' });
        }
        const customer = await db_1.default.customer.create({
            data: { name, email, phone, address, company },
        });
        res.status(201).json({
            message: 'Customer added successfully',
            customer,
        });
    }
    catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ message: 'Error registering new customer' });
    }
};
exports.createCustomer = createCustomer;
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, company } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required fields' });
        }
        // Check email uniqueness but skip current record
        const emailConflict = await db_1.default.customer.findFirst({
            where: {
                email,
                id: { not: id },
            },
        });
        if (emailConflict) {
            return res.status(400).json({ message: 'A customer with this email already exists' });
        }
        const customer = await db_1.default.customer.update({
            where: { id },
            data: { name, email, phone, address, company },
        });
        res.json({
            message: 'Customer details updated successfully',
            customer,
        });
    }
    catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Error updating customer information' });
    }
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if customer has orders
        const orderCount = await db_1.default.order.count({ where: { customerId: id } });
        if (orderCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete customer: they are associated with existing sales orders.',
            });
        }
        await db_1.default.customer.delete({ where: { id } });
        res.json({ message: 'Customer deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ message: 'Error deleting customer' });
    }
};
exports.deleteCustomer = deleteCustomer;
// ==========================================
// SALES ORDERS & INVOICES
// ==========================================
const getOrders = async (req, res) => {
    try {
        const { search, status } = req.query;
        const whereClause = {};
        if (status && status !== 'all') {
            whereClause.status = status;
        }
        if (search) {
            whereClause.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                {
                    customer: {
                        name: { contains: search, mode: 'insensitive' },
                    },
                },
            ];
        }
        const orders = await db_1.default.order.findMany({
            where: whereClause,
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ orders });
    }
    catch (error) {
        console.error('Error fetching sales orders:', error);
        res.status(500).json({ message: 'Error retrieving sales orders' });
    }
};
exports.getOrders = getOrders;
const createOrder = async (req, res) => {
    try {
        const { customerId, items, status, paymentTerms } = req.body;
        if (!customerId || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Customer selection and item list are required' });
        }
        // Process order creation inside a transaction
        const newOrder = await db_1.default.$transaction(async (tx) => {
            let subtotal = 0;
            // Validate quantities and calculate totals
            const validatedItems = [];
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }
                if (product.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
                }
                subtotal += product.price * item.quantity;
                validatedItems.push({
                    productId: product.id,
                    quantity: item.quantity,
                    price: product.price, // Save price locked at purchase time
                });
                // Deduct quantity from inventory
                await tx.product.update({
                    where: { id: product.id },
                    data: { quantity: product.quantity - item.quantity },
                });
            }
            // Calculate taxes (8% tax rate)
            const taxRate = 0.08;
            const tax = subtotal * taxRate;
            const total = subtotal + tax;
            // Auto-generate order number
            const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
            const orderNumber = `SO-${dateString}-${uniqueSuffix}`;
            // Create Order and nested items
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    customerId,
                    status: status || 'UNPAID',
                    subtotal,
                    tax,
                    total,
                    paymentTerms: paymentTerms || 'DUE ON RECEIPT',
                    items: {
                        create: validatedItems,
                    },
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
            // Create stock history logs for all item deductions
            for (const item of validatedItems) {
                await tx.stockHistory.create({
                    data: {
                        productId: item.productId,
                        change: -item.quantity,
                        type: 'SALE',
                        referenceId: order.id,
                        notes: `Sale Order ${order.orderNumber}`,
                    },
                });
            }
            return order;
        });
        res.status(201).json({
            message: 'Sales Order created successfully',
            order: newOrder,
        });
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({ message: error.message || 'Error processing sales checkout' });
    }
};
exports.createOrder = createOrder;
