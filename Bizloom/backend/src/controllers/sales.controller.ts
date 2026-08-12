import { Request, Response } from 'express';
import prisma from '../config/db';

// ==========================================
// CUSTOMER MANAGEMENT
// ==========================================

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    res.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Error retrieving customer list' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, company } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required fields' });
    }

    const existingCustomer = await prisma.customer.findUnique({ where: { email } });
    if (existingCustomer) {
      return res.status(400).json({ message: 'A customer with this email already exists' });
    }

    const customer = await prisma.customer.create({
      data: { name, email, phone, address, company },
    });

    res.status(201).json({
      message: 'Customer added successfully',
      customer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Error registering new customer' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, company } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required fields' });
    }

    // Check email uniqueness but skip current record
    const emailConflict = await prisma.customer.findFirst({
      where: {
        email,
        id: { not: id },
      },
    });

    if (emailConflict) {
      return res.status(400).json({ message: 'A customer with this email already exists' });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, email, phone, address, company },
    });

    res.json({
      message: 'Customer details updated successfully',
      customer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Error updating customer information' });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if customer has orders
    const orderCount = await prisma.order.count({ where: { customerId: id } });
    if (orderCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete customer: they are associated with existing sales orders.',
      });
    }

    await prisma.customer.delete({ where: { id } });
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Error deleting customer' });
  }
};

// ==========================================
// SALES ORDERS & INVOICES
// ==========================================

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { search, status, sortBy, sortOrder, page, limit } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status as string;
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        {
          customer: {
            name: { contains: search as string, mode: 'insensitive' },
          },
        },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy) {
      const field = sortBy as string;
      const order = (sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      if (field === 'customer') {
        orderBy = { customer: { name: order } };
      } else {
        orderBy = { [field]: order };
      }
    }

    const [orders, totalCount] = await prisma.$transaction([
      prisma.order.findMany({
        where: whereClause,
        include: {
          customer: true,
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
      prisma.order.count({ where: whereClause }),
    ]);

    res.json({
      orders,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({ message: 'Error retrieving sales orders' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PAID', 'UNPAID', 'PARTIAL'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
};


export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customerId, items, status, paymentTerms } = req.body;

    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Customer selection and item list are required' });
    }

    // Process order creation inside a transaction
    const newOrder = await prisma.$transaction(async (tx) => {
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
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(400).json({ message: error.message || 'Error processing sales checkout' });
  }
};
