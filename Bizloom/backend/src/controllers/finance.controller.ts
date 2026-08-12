import { Request, Response } from 'express';
import prisma from '../config/db';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { type, category, startDate, endDate, page, limit } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    if (type && type !== 'all') {
      whereClause.type = type as string;
    }

    if (category && category !== 'all') {
      whereClause.category = category as string;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        // Set to end of the selected day
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load transactions' });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { type, category, amount, description, date } = req.body;

    if (!type || !category || amount === undefined) {
      return res.status(400).json({ message: 'Type, Category, and Amount are required' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        category,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json({ message: 'Transaction recorded successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record transaction' });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.transaction.delete({ where: { id } });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete transaction' });
  }
};

export const getLedger = async (req: Request, res: Response) => {
  try {
    // Get all transactions sorted by date
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
    });

    // Group by Month Year (e.g. "August 2026")
    const groups: Record<string, { month: string; income: number; expense: number; transactions: any[] }> = {};

    for (const t of transactions) {
      const date = new Date(t.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!groups[monthYear]) {
        groups[monthYear] = {
          month: monthYear,
          income: 0,
          expense: 0,
          transactions: [],
        };
      }

      if (t.type === 'INCOME') {
        groups[monthYear].income += t.amount;
      } else {
        groups[monthYear].expense += t.amount;
      }

      groups[monthYear].transactions.push(t);
    }

    res.json({ ledger: Object.values(groups) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load ledger groups' });
  }
};

export const getProfitLossSummary = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany();

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const t of transactions) {
      if (t.type === 'INCOME') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
      }
    }

    const netProfit = totalIncome - totalExpenses;

    // Build simple category breakdown chart data
    const categoryBreakdown: Record<string, { category: string; type: string; total: number }> = {};
    for (const t of transactions) {
      const key = `${t.type}-${t.category}`;
      if (!categoryBreakdown[key]) {
        categoryBreakdown[key] = { category: t.category, type: t.type, total: 0 };
      }
      categoryBreakdown[key].total += t.amount;
    }

    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
      },
      chartData: [
        { name: 'Income', value: totalIncome },
        { name: 'Expense', value: totalExpenses },
      ],
      categories: Object.values(categoryBreakdown),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load Profit & Loss summary' });
  }
};
