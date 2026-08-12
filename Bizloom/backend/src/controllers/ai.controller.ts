import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';
import Anthropic from '@anthropic-ai/sdk';

export const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
    return null;
  }
  return new Anthropic({ apiKey });
};

// Intent detection — maps user message to database query
async function detectIntentAndQuery(message: string): Promise<{ intent: string; data: any; description: string }> {
  const msg = message.toLowerCase();

  // ── Sales queries ──
  if (msg.includes('total sales') || msg.includes('revenue') || msg.includes('sales this month') || msg.includes('how much') && msg.includes('sold')) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const agg = await prisma.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: { createdAt: { gte: startOfMonth } }
    });
    const allTime = await prisma.order.aggregate({ _sum: { total: true }, _count: true });
    return {
      intent: 'sales_total',
      data: {
        thisMonth: { total: agg._sum.total || 0, count: agg._count },
        allTime: { total: allTime._sum.total || 0, count: allTime._count }
      },
      description: 'Sales revenue data'
    };
  }

  if (msg.includes('best selling') || msg.includes('top product') || msg.includes('most sold') || msg.includes('popular product')) {
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });
    const productDetails = await Promise.all(
      topProducts.map(async (tp) => {
        const product = await prisma.product.findUnique({ where: { id: tp.productId }, select: { name: true, category: true, price: true } });
        return { name: product?.name, category: product?.category, unitsSold: tp._sum.quantity, price: product?.price };
      })
    );
    return { intent: 'top_products', data: productDetails, description: 'Top selling products' };
  }

  // ── Inventory queries ──
  if (msg.includes('low stock') || msg.includes('out of stock') || msg.includes('stock level') || msg.includes('running low')) {
    const lowStock = await prisma.product.findMany({
      where: { quantity: { lte: prisma.product.fields?.minStockLevel as any || 10 } },
      orderBy: { quantity: 'asc' },
      take: 10,
      select: { name: true, sku: true, quantity: true, minStockLevel: true, category: true }
    });
    // Fallback: just get products where quantity <= minStockLevel using raw comparison
    const allProducts = await prisma.product.findMany({
      select: { name: true, sku: true, quantity: true, minStockLevel: true, category: true }
    });
    const lowItems = allProducts.filter(p => p.quantity <= p.minStockLevel).sort((a, b) => a.quantity - b.quantity).slice(0, 10);
    return { intent: 'low_stock', data: lowItems, description: 'Products with low or zero stock' };
  }

  if (msg.includes('inventory') || msg.includes('how many product') || msg.includes('product count')) {
    const count = await prisma.product.count();
    const totalValue = await prisma.product.findMany({ select: { quantity: true, cost: true } });
    const value = totalValue.reduce((s, p) => s + p.quantity * p.cost, 0);
    return { intent: 'inventory_overview', data: { totalProducts: count, totalValue: value }, description: 'Inventory overview' };
  }

  // ── Customer queries ──
  if (msg.includes('top customer') || msg.includes('best customer') || msg.includes('top 5 customer') || msg.includes('biggest customer')) {
    const topCustomers = await prisma.order.groupBy({
      by: ['customerId'],
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: 'desc' } },
      take: 5
    });
    const customerDetails = await Promise.all(
      topCustomers.map(async (tc) => {
        const customer = await prisma.customer.findUnique({ where: { id: tc.customerId }, select: { name: true, email: true, company: true } });
        return { name: customer?.name, company: customer?.company, totalSpent: tc._sum.total, orderCount: tc._count };
      })
    );
    return { intent: 'top_customers', data: customerDetails, description: 'Top customers by revenue' };
  }

  if (msg.includes('customer') && (msg.includes('count') || msg.includes('how many'))) {
    const count = await prisma.customer.count();
    return { intent: 'customer_count', data: { totalCustomers: count }, description: 'Total customer count' };
  }

  // ── HR queries ──
  if (msg.includes('employee') && (msg.includes('count') || msg.includes('how many') || msg.includes('total'))) {
    const active = await prisma.employee.count({ where: { status: 'ACTIVE' } });
    const total = await prisma.employee.count();
    return { intent: 'employee_count', data: { active, total }, description: 'Employee count' };
  }

  if (msg.includes('attendance') && msg.includes('today')) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const present = await prisma.attendance.count({
      where: { date: { gte: today, lt: tomorrow } }
    });
    const totalActive = await prisma.employee.count({ where: { status: 'ACTIVE' } });
    return { intent: 'attendance_today', data: { present, totalActive, absent: totalActive - present }, description: "Today's attendance" };
  }

  // ── Finance queries ──
  if (msg.includes('profit') || msg.includes('expense') || msg.includes('income') || msg.includes('p&l') || msg.includes('financial')) {
    const income = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'INCOME' } });
    const expense = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'EXPENSE' } });
    const totalIncome = income._sum.amount || 0;
    const totalExpenses = expense._sum.amount || 0;
    return {
      intent: 'financial_summary',
      data: { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses },
      description: 'Financial summary (P&L)'
    };
  }

  // ── Fallback: general status ──
  const orderCount = await prisma.order.count();
  const productCount = await prisma.product.count();
  const customerCount = await prisma.customer.count();
  const employeeCount = await prisma.employee.count();
  return {
    intent: 'general_status',
    data: { orders: orderCount, products: productCount, customers: customerCount, employees: employeeCount },
    description: 'General business overview'
  };
}

export const chatWithAI = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Step 1: Detect intent and query the database
    const { intent, data, description } = await detectIntentAndQuery(message);

    // Step 2: Try Claude API, fall back to template response
    const anthropic = getAnthropicClient();

    if (anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: `You are Bizloom AI, a friendly and professional business assistant for an ERP system called "Business ERP Lite". 
You receive a user question along with real database query results. Your job is to answer the question conversationally using the actual data provided. 
Keep answers concise (2-4 sentences max). Use specific numbers and format currencies with $ and commas. 
Never make up data — only use what's provided. If the data doesn't fully answer the question, say so politely.
Add a relevant emoji at the start of your response.`,
          messages: [{
            role: 'user',
            content: `User question: "${message}"

Database query result (${description}):
${JSON.stringify(data, null, 2)}

Please answer the user's question using this data.`
          }]
        });

        const textBlock = response.content.find((b: any) => b.type === 'text');
        const reply = textBlock ? (textBlock as any).text : 'I processed your query but couldn\'t generate a response.';

        return res.json({ reply, intent, sources: [description] });
      } catch (aiError) {
        console.error('Claude API error, falling back to template:', aiError);
      }
    }

    // Fallback: Template-based response (no API key needed)
    const reply = generateTemplateResponse(intent, data, message);
    res.json({ reply, intent, sources: [description] });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ message: 'Failed to process your question' });
  }
};

function generateTemplateResponse(intent: string, data: any, question: string): string {
  switch (intent) {
    case 'sales_total':
      return `📊 This month's total sales are **$${data.thisMonth.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}** across **${data.thisMonth.count}** orders. All-time revenue stands at **$${data.allTime.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}** from **${data.allTime.count}** orders.`;
    case 'top_products':
      const topList = data.map((p: any, i: number) => `${i + 1}. **${p.name}** (${p.unitsSold} units sold)`).join('\n');
      return `🏆 Here are your top-selling products:\n${topList}`;
    case 'low_stock':
      if (data.length === 0) return '✅ Great news! All products are well-stocked. No items are below their minimum stock levels.';
      const lowList = data.slice(0, 5).map((p: any) => `• **${p.name}** — ${p.quantity} left (min: ${p.minStockLevel})`).join('\n');
      return `⚠️ **${data.length} products** are at or below minimum stock:\n${lowList}`;
    case 'inventory_overview':
      return `📦 Your inventory has **${data.totalProducts} products** with a total stock value of **$${data.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}**.`;
    case 'top_customers':
      const custList = data.map((c: any, i: number) => `${i + 1}. **${c.name}** ${c.company ? `(${c.company})` : ''} — $${c.totalSpent?.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${c.orderCount} orders)`).join('\n');
      return `👥 Your top customers by revenue:\n${custList}`;
    case 'customer_count':
      return `👥 You currently have **${data.totalCustomers} customers** in the database.`;
    case 'employee_count':
      return `👨‍💼 You have **${data.active} active employees** out of **${data.total} total** in the system.`;
    case 'attendance_today':
      return `📋 Today's attendance: **${data.present}/${data.totalActive}** employees checked in. **${data.absent}** are absent.`;
    case 'financial_summary':
      return `💰 Financial Summary:\n• Total Income: **$${data.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}**\n• Total Expenses: **$${data.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}**\n• Net Profit: **$${data.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}**`;
    default:
      return `📈 Here's a quick overview of your business:\n• **${data.orders}** total orders\n• **${data.products}** products in inventory\n• **${data.customers}** customers\n• **${data.employees}** employees\n\nTry asking about specific topics like "total sales this month", "low stock items", or "top 5 customers"!`;
  }
}
