import { Request, Response } from 'express';
import prisma from '../config/db';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category, stockStatus, sortBy, sortOrder, page, limit } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    // Build Prisma query filters
    const whereClause: any = {};

    // Search filter (matches name or SKU case-insensitively)
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      whereClause.category = { equals: category as string, mode: 'insensitive' };
    }

    // Sort options
    let orderBy: any = { createdAt: 'desc' };
    const isCustomSort = sortBy === 'estimatedDaysUntilStockout' || sortBy === 'stockoutUrgency';
    if (sortBy && !isCustomSort) {
      const field = sortBy as string;
      const order = (sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      orderBy = { [field]: order };
    }

    // Fetch all matching products first to calculate predictions and filter/sort in memory
    const allMatching = await prisma.product.findMany({
      where: whereClause,
      orderBy: !isCustomSort ? orderBy : undefined,
    });

    // Calculate predictions (velocity in last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const stockHistories = await prisma.stockHistory.findMany({
      where: {
        productId: { in: allMatching.map(p => p.id) },
        type: 'SALE',
        createdAt: { gte: fourteenDaysAgo }
      },
      select: {
        productId: true,
        change: true
      }
    });

    const salesMap: Record<string, number> = {};
    stockHistories.forEach(h => {
      salesMap[h.productId] = (salesMap[h.productId] || 0) + Math.abs(h.change);
    });

    let processedProducts = allMatching.map(p => {
      const salesLast14Days = salesMap[p.id] || 0;
      const avgDailySales = salesLast14Days / 14;
      let estimatedDaysUntilStockout: number | null = null;
      let stockoutRisk: 'CRITICAL' | 'WARNING' | 'MODERATE' | 'SAFE' = 'SAFE';

      if (p.quantity === 0) {
        estimatedDaysUntilStockout = 0;
        stockoutRisk = 'CRITICAL';
      } else if (avgDailySales > 0) {
        estimatedDaysUntilStockout = Math.round((p.quantity / avgDailySales) * 10) / 10;
        if (estimatedDaysUntilStockout <= 3) stockoutRisk = 'CRITICAL';
        else if (estimatedDaysUntilStockout <= 7) stockoutRisk = 'WARNING';
        else if (estimatedDaysUntilStockout <= 14) stockoutRisk = 'MODERATE';
      }

      let suggestedReorder = 0;
      if (avgDailySales > 0 || p.quantity <= p.minStockLevel) {
        suggestedReorder = Math.max(0, Math.ceil((avgDailySales * 14) + p.minStockLevel - p.quantity));
      }

      return {
        ...p,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        estimatedDaysUntilStockout,
        stockoutRisk,
        suggestedReorder
      };
    });

    // Apply stockStatus filter in-memory
    if (stockStatus && stockStatus !== 'all') {
      processedProducts = processedProducts.filter((p) => {
        if (stockStatus === 'IN_STOCK') return p.quantity > p.minStockLevel;
        if (stockStatus === 'LOW_STOCK') return p.quantity > 0 && p.quantity <= p.minStockLevel;
        if (stockStatus === 'OUT_OF_STOCK') return p.quantity === 0;
        return true;
      });
    }

    // Apply custom sort in-memory if requested
    if (isCustomSort) {
      const order = (sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      processedProducts.sort((a, b) => {
        const valA = a.estimatedDaysUntilStockout === null ? 999999 : a.estimatedDaysUntilStockout;
        const valB = b.estimatedDaysUntilStockout === null ? 999999 : b.estimatedDaysUntilStockout;
        return order === 'asc' ? valA - valB : valB - valA;
      });
    }

    const totalCount = processedProducts.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedProducts = processedProducts.slice(skip, skip + limitNum);

    // Categories list for filters
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    res.json({
      products: paginatedProducts,
      categories: categories.map((c) => c.category),
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error fetching products' });
  }
};

export const getProductHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = await prisma.stockHistory.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'asc' }, // Ascending order to show trend over time
    });

    res.json({ history });
  } catch (error) {
    console.error('Error fetching product history:', error);
    res.status(500).json({ message: 'Error fetching product stock history' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, sku, description, price, cost, quantity, minStockLevel, category } = req.body;

    if (!name || !sku || price === undefined || cost === undefined || quantity === undefined || !category) {
      return res.status(400).json({ message: 'Please provide all required product details' });
    }

    const existingProduct = await prisma.product.findUnique({ where: { sku } });
    if (existingProduct) {
      return res.status(400).json({ message: 'A product with this SKU already exists' });
    }

    // Create product and log initial stock in transaction
    const newProduct = await prisma.$transaction(async (tx) => {
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
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error registering new product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sku, description, price, cost, quantity, minStockLevel, category } = req.body;

    if (!name || !sku || price === undefined || cost === undefined || quantity === undefined || !category) {
      return res.status(400).json({ message: 'Please provide all required product details' });
    }

    const existingSku = await prisma.product.findFirst({
      where: { sku, id: { not: id } },
    });

    if (existingSku) {
      return res.status(400).json({ message: 'Another product with this SKU already exists' });
    }

    const currentProduct = await prisma.product.findUnique({ where: { id } });
    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const newQty = parseInt(quantity);
    const qtyChange = newQty - currentProduct.quantity;

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          name,
          sku,
          description,
          price: parseFloat(price),
          cost: parseFloat(cost),
          quantity: newQty,
          minStockLevel: parseInt(minStockLevel) || 5,
          category,
        },
      });

      if (qtyChange !== 0) {
        await tx.stockHistory.create({
          data: {
            productId: id,
            change: qtyChange,
            type: 'ADJUSTMENT',
            notes: `Stock quantity adjusted from ${currentProduct.quantity} to ${newQty}`,
          },
        });
      }

      return product;
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product information' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if the product is referenced in any orders
    const referenceCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (referenceCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete product: it is associated with existing sales orders.',
      });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

export const bulkDeleteProducts = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide a list of product IDs' });
    }

    // Check if any of these products are associated with existing sales orders
    const referencedProducts = await prisma.orderItem.findMany({
      where: { productId: { in: ids } },
      select: { productId: true },
      distinct: ['productId'],
    });

    if (referencedProducts.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete: some selected products are referenced in existing sales orders.',
      });
    }

    await prisma.product.deleteMany({
      where: { id: { in: ids } },
    });

    res.json({ message: 'Products deleted in bulk successfully' });
  } catch (error) {
    console.error('Error during bulk deletion:', error);
    res.status(500).json({ message: 'Error deleting products in bulk' });
  }
};

