"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteProducts = exports.deleteProduct = exports.createProduct = exports.getProductHistory = exports.getProducts = void 0;
const db_1 = __importDefault(require("../config/db"));
const getProducts = async (req, res) => {
    try {
        const { search, category, stockStatus, sortBy, sortOrder, page, limit } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        // Build Prisma query filters
        const whereClause = {};
        // Search filter (matches name or SKU case-insensitively)
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }
        // Category filter
        if (category && category !== 'all') {
            whereClause.category = { equals: category, mode: 'insensitive' };
        }
        // Stock Status filter
        if (stockStatus && stockStatus !== 'all') {
            if (stockStatus === 'IN_STOCK') {
                whereClause.quantity = { gt: db_1.default.product.fields.minStockLevel };
            }
            else if (stockStatus === 'LOW_STOCK') {
                whereClause.AND = [
                    { quantity: { lte: db_1.default.product.fields.minStockLevel } },
                    { quantity: { gt: 0 } }
                ];
            }
            else if (stockStatus === 'OUT_OF_STOCK') {
                whereClause.quantity = { equals: 0 };
            }
        }
        // Sort options
        let orderBy = { createdAt: 'desc' };
        if (sortBy) {
            const field = sortBy;
            const order = sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
            orderBy = { [field]: order };
        }
        // Fetch products and total count in parallel
        const [products, totalCount] = await db_1.default.$transaction([
            db_1.default.product.findMany({
                where: whereClause,
                orderBy,
                skip,
                take: limitNum,
            }),
            db_1.default.product.count({ where: whereClause }),
        ]);
        // Categories list for filters
        const categories = await db_1.default.product.findMany({
            select: { category: true },
            distinct: ['category'],
        });
        res.json({
            products,
            categories: categories.map((c) => c.category),
            pagination: {
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalCount / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error fetching products' });
    }
};
exports.getProducts = getProducts;
const getProductHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await db_1.default.stockHistory.findMany({
            where: { productId: id },
            orderBy: { createdAt: 'asc' }, // Ascending order to show trend over time
        });
        res.json({ history });
    }
    catch (error) {
        console.error('Error fetching product history:', error);
        res.status(500).json({ message: 'Error fetching product stock history' });
    }
};
exports.getProductHistory = getProductHistory;
const createProduct = async (req, res) => {
    try {
        const { name, sku, description, price, cost, quantity, minStockLevel, category } = req.body;
        if (!name || !sku || price === undefined || cost === undefined || quantity === undefined || !category) {
            return res.status(400).json({ message: 'Please provide all required product details' });
        }
        const existingProduct = await db_1.default.product.findUnique({ where: { sku } });
        if (existingProduct) {
            return res.status(400).json({ message: 'A product with this SKU already exists' });
        }
        // Create product and log initial stock in transaction
        const newProduct = await db_1.default.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name,
                    sku,
                    description,
                    price: parseFloat(price),
                    cost: parseFloat(cost),
                    quantity: parseInt(quantity),
                    minStockLevel: parseInt(minStockLevel) || 5,
                    category,
                },
            });
            if (parseInt(quantity) > 0) {
                await tx.stockHistory.create({
                    data: {
                        productId: product.id,
                        change: parseInt(quantity),
                        type: 'RESTOCK',
                        notes: 'Initial inventory restock',
                    },
                });
            }
            return product;
        });
        res.status(201).json({
            message: 'Product created successfully',
            product: newProduct,
        });
    }
    catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error registering new product' });
    }
};
exports.createProduct = createProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if the product is referenced in any orders
        const referenceCount = await db_1.default.orderItem.count({
            where: { productId: id },
        });
        if (referenceCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete product: it is associated with existing sales orders.',
            });
        }
        await db_1.default.product.delete({ where: { id } });
        res.json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
};
exports.deleteProduct = deleteProduct;
const bulkDeleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Please provide a list of product IDs' });
        }
        // Check if any of these products are associated with existing sales orders
        const referencedProducts = await db_1.default.orderItem.findMany({
            where: { productId: { in: ids } },
            select: { productId: true },
            distinct: ['productId'],
        });
        if (referencedProducts.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete: some selected products are referenced in existing sales orders.',
            });
        }
        await db_1.default.product.deleteMany({
            where: { id: { in: ids } },
        });
        res.json({ message: 'Products deleted in bulk successfully' });
    }
    catch (error) {
        console.error('Error during bulk deletion:', error);
        res.status(500).json({ message: 'Error deleting products in bulk' });
    }
};
exports.bulkDeleteProducts = bulkDeleteProducts;
