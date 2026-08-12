import { Request, Response } from 'express';
import prisma from '../config/db';

// ---------------- SUPPLIERS ----------------

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { company: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    res.json({ suppliers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve suppliers' });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and Email are required fields' });
    }

    // Check unique email
    const existing = await prisma.supplier.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'A supplier with this email already exists' });
    }

    const supplier = await prisma.supplier.create({
      data: { name, email, phone, company, address },
    });

    res.status(201).json({ message: 'Supplier created successfully', supplier });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create supplier' });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and Email are required fields' });
    }

    // Check unique email (excluding current)
    const existing = await prisma.supplier.findFirst({
      where: { email, NOT: { id } },
    });
    if (existing) {
      return res.status(400).json({ message: 'Another supplier with this email already exists' });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, email, phone, company, address },
    });

    res.json({ message: 'Supplier updated successfully', supplier });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update supplier' });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if supplier has associated purchase orders
    const pos = await prisma.purchaseOrder.findFirst({ where: { supplierId: id } });
    if (pos) {
      return res.status(400).json({
        message: 'Cannot delete supplier because they have existing purchase orders. Delete or update the purchase orders first.',
      });
    }

    await prisma.supplier.delete({ where: { id } });
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete supplier' });
  }
};

// ---------------- PURCHASE ORDERS ----------------

export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { search, status, sortBy, sortOrder, page, limit } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 8;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status as string;
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search as string } },
        { supplier: { name: { contains: search as string } } },
        { supplier: { company: { contains: search as string } } },
      ];
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy) {
      const field = sortBy as string;
      const order = (sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

      if (field === 'supplier') {
        orderBy = { supplier: { name: order } };
      } else {
        orderBy = { [field]: order };
      }
    }

    const [orders, total] = await prisma.$transaction([
      prisma.purchaseOrder.findMany({
        where: whereClause,
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.purchaseOrder.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load purchase orders' });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { supplierId, status, paymentTerms, items } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Supplier ID and list of items are required' });
    }

    // Auto-generate PO number
    const count = await prisma.purchaseOrder.count();
    const orderNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const poItemsData = items.map((item: any) => {
      const lineCost = item.quantity * item.unitCost;
      subtotal += lineCost;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      };
    });

    const tax = subtotal * 0.08; // 8% sales/purchase tax
    const total = subtotal + tax;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId,
        status: status || 'PENDING',
        paymentTerms: paymentTerms || 'DUE ON RECEIPT',
        subtotal,
        tax,
        total,
        items: {
          create: poItemsData,
        },
      },
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
      },
    });

    // If order was created as RECEIVED, increment product quantities right away
    if (status === 'RECEIVED') {
      await prisma.$transaction(
        items.map((item: any) =>
          prisma.product.update({
            where: { id: item.productId },
            data: {
              quantity: { increment: item.quantity },
              stockHistory: {
                create: {
                  change: item.quantity,
                  type: 'RESTOCK',
                  notes: `Received via new Purchase Order ${orderNumber}`,
                },
              },
            },
          })
        )
      );
    }

    res.status(201).json({
      message: 'Purchase Order created successfully',
      order: purchaseOrder,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create purchase order' });
  }
};

export const receivePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (order.status === 'RECEIVED') {
      return res.status(400).json({ message: 'Purchase order has already been marked as RECEIVED' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot receive a CANCELLED purchase order' });
    }

    // Run transaction: update status, increment stock, create stockHistory
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update PO status
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED' },
        include: { supplier: true, items: { include: { product: true } } },
      });

      // 2. Loop and increment product stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity },
            stockHistory: {
              create: {
                change: item.quantity,
                type: 'RESTOCK',
                referenceId: order.id,
                notes: `Received via Purchase Order ${order.orderNumber}`,
              },
            },
          },
        });
      }

      return updated;
    });

    res.json({
      message: `Purchase order marked as RECEIVED and inventory stock updated!`,
      order: updatedOrder,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to receive purchase order' });
  }
};
