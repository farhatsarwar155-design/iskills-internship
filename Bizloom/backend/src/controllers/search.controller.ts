import { Request, Response } from 'express';
import prisma from '../config/db';

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();

    if (!q) {
      return res.json({
        products: [],
        customers: [],
        orders: [],
        suppliers: [],
        employees: []
      });
    }

    // Parallel queries to Prisma database (SQLite — no mode: 'insensitive')
    const [products, customers, orders, suppliers, employees] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { sku: { contains: q } }
          ]
        },
        take: 5,
        select: { id: true, name: true, sku: true, category: true, quantity: true }
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { company: { contains: q } }
          ]
        },
        take: 5,
        select: { id: true, name: true, email: true, company: true }
      }),
      prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: q } }
          ]
        },
        take: 5,
        select: { id: true, orderNumber: true, total: true, status: true, customer: { select: { name: true } } }
      }),
      prisma.supplier.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { company: { contains: q } }
          ]
        },
        take: 5,
        select: { id: true, name: true, email: true, company: true }
      }),
      prisma.employee.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { position: { contains: q } }
          ]
        },
        take: 5,
        select: { id: true, name: true, email: true, position: true, department: true }
      })
    ]);

    res.json({
      products,
      customers,
      orders,
      suppliers,
      employees
    });
  } catch (error) {
    console.error('Error during global search:', error);
    res.status(500).json({ message: 'Error performing global search' });
  }
};
