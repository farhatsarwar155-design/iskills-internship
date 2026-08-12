import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';
import Anthropic from '@anthropic-ai/sdk';

const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-anthropic-api-key-here') return null;
  return new Anthropic({ apiKey });
};

export const getAnalyticsOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // ── 1. Sales Trend (daily) ──
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group orders by day
    const dailySales: Record<string, number> = {};
    for (let d = 0; d < days; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      const key = date.toISOString().split('T')[0];
      dailySales[key] = 0;
    }
    orders.forEach(o => {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (dailySales[key] !== undefined) dailySales[key] += o.total;
    });

    const salesTrend = Object.entries(dailySales).map(([date, total]) => ({
      date,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: Math.round(total * 100) / 100
    }));

    // ── 2. Revenue by Category (for pie/donut chart) ──
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: startDate } } },
      include: { product: { select: { category: true } } }
    });

    const categoryRevenue: Record<string, number> = {};
    orderItems.forEach(item => {
      const cat = item.product.category || 'Uncategorized';
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.price * item.quantity);
    });

    const revenueByCategory = Object.entries(categoryRevenue)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);

    // ── 3. Top 5 Products by Revenue ──
    const productRevenue: Record<string, { name: string; revenue: number; units: number }> = {};
    orderItems.forEach(item => {
      const id = item.productId;
      if (!productRevenue[id]) {
        productRevenue[id] = { name: '', revenue: 0, units: 0 };
      }
      productRevenue[id].revenue += item.price * item.quantity;
      productRevenue[id].units += item.quantity;
    });

    // Fetch product names
    const productIds = Object.keys(productRevenue);
    const productNames = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });
    productNames.forEach(p => {
      if (productRevenue[p.id]) productRevenue[p.id].name = p.name;
    });

    const topProducts = Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({ name: p.name, revenue: Math.round(p.revenue * 100) / 100, units: p.units }));

    // ── 4. Income vs Expense (monthly) ──
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate } },
      select: { type: true, amount: true, date: true }
    });

    const monthlyFinance: Record<string, { month: string; income: number; expense: number }> = {};
    transactions.forEach(t => {
      const month = new Date(t.date).toLocaleString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyFinance[month]) monthlyFinance[month] = { month, income: 0, expense: 0 };
      if (t.type === 'INCOME') monthlyFinance[month].income += t.amount;
      else monthlyFinance[month].expense += t.amount;
    });

    const incomeVsExpense = Object.values(monthlyFinance).map(m => ({
      month: m.month,
      income: Math.round(m.income * 100) / 100,
      expense: Math.round(m.expense * 100) / 100
    }));

    // ── 5. Customer Growth ──
    const customers = await prisma.customer.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const customerGrowth: Record<string, number> = {};
    customers.forEach(c => {
      const month = new Date(c.createdAt).toLocaleString('en-US', { month: 'short', year: '2-digit' });
      customerGrowth[month] = (customerGrowth[month] || 0) + 1;
    });

    // Cumulative growth
    let cumulative = 0;
    const customerGrowthData = Object.entries(customerGrowth).map(([month, count]) => {
      cumulative += count;
      return { month, newCustomers: count, total: cumulative };
    });

    // ── Summary stats ──
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      period: { days, startDate: startDate.toISOString(), endDate: now.toISOString() },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        topCategory: revenueByCategory[0]?.name || 'N/A'
      },
      charts: {
        salesTrend,
        revenueByCategory,
        topProducts,
        incomeVsExpense,
        customerGrowth: customerGrowthData
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
};

export const getAISummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - days);

    // Gather key metrics
    const currentRevenue = await prisma.order.aggregate({
      _sum: { total: true }, _count: true,
      where: { createdAt: { gte: startDate } }
    });
    const prevRevenue = await prisma.order.aggregate({
      _sum: { total: true }, _count: true,
      where: { createdAt: { gte: prevStart, lt: startDate } }
    });

    const curRev = currentRevenue._sum.total || 0;
    const prevRev = prevRevenue._sum.total || 0;
    const revChange = prevRev > 0 ? ((curRev - prevRev) / prevRev * 100) : 0;

    // Top category
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: startDate } } },
      include: { product: { select: { category: true } } }
    });
    const catRev: Record<string, number> = {};
    orderItems.forEach(i => {
      const cat = i.product.category || 'Other';
      catRev[cat] = (catRev[cat] || 0) + i.price * i.quantity;
    });
    const topCat = Object.entries(catRev).sort((a, b) => b[1] - a[1])[0];

    // Low stock
    const allProducts = await prisma.product.findMany({ select: { quantity: true, minStockLevel: true } });
    const lowStockCount = allProducts.filter(p => p.quantity <= p.minStockLevel).length;

    // New customers
    const newCustomers = await prisma.customer.count({ where: { createdAt: { gte: startDate } } });

    const metricsText = `Period: Last ${days} days
Revenue: $${curRev.toFixed(2)} (${revChange >= 0 ? '+' : ''}${revChange.toFixed(1)}% vs previous period)
Orders: ${currentRevenue._count}
Top Category: ${topCat ? `${topCat[0]} ($${topCat[1].toFixed(2)})` : 'N/A'}
Low Stock Items: ${lowStockCount}
New Customers: ${newCustomers}`;

    const anthropic = getAnthropicClient();

    if (anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: `You are a business analytics AI for "Business ERP Lite". Given key metrics, write a 2-3 sentence executive summary that sounds professional and insightful. Mention specific numbers. Start with the most impactful insight. Use plain text, no markdown.`,
          messages: [{ role: 'user', content: `Write a brief executive summary for these business metrics:\n${metricsText}` }]
        });
        const textBlock = response.content.find((b: any) => b.type === 'text');
        return res.json({ summary: textBlock ? (textBlock as any).text : 'Summary unavailable.', metrics: metricsText });
      } catch (err) {
        console.error('Claude API error for summary:', err);
      }
    }

    // Fallback template
    const direction = revChange >= 0 ? 'increased' : 'decreased';
    const summary = `Over the last ${days} days, revenue ${direction} by ${Math.abs(revChange).toFixed(1)}% to $${curRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}, driven primarily by ${topCat ? topCat[0] : 'sales activity'}. ${lowStockCount > 0 ? `${lowStockCount} products are currently at or below minimum stock levels and may need reordering.` : 'All inventory levels are healthy.'} ${newCustomers > 0 ? `${newCustomers} new customers were added during this period.` : ''}`;

    res.json({ summary, metrics: metricsText });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({ message: 'Error generating summary' });
  }
};
