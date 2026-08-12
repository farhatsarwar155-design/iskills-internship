import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';
import { getAnthropicClient } from './ai.controller';

// Simple Linear Regression implementation (no external dep needed for this)
function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
}

export const getDashboardData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ── Real stat cards from database ──
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Total Sales (this month)
    const salesThisMonth = await prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: startOfMonth } }
    });
    const salesLastMonth = await prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
    });
    const currentSales = salesThisMonth._sum.total || 0;
    const prevSales = salesLastMonth._sum.total || 0;
    const salesChange = prevSales > 0 ? ((currentSales - prevSales) / prevSales * 100) : 0;

    // Inventory Value
    const products = await prisma.product.findMany({ select: { quantity: true, cost: true } });
    const inventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.cost), 0);

    // Pending Orders (UNPAID or PARTIAL)
    const pendingOrders = await prisma.order.count({
      where: { status: { in: ['UNPAID', 'PARTIAL'] } }
    });

    // Active Employees
    const activeEmployees = await prisma.employee.count({
      where: { status: 'ACTIVE' }
    });

    const stats = {
      totalSales: {
        value: `$${currentSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        change: `${salesChange >= 0 ? '+' : ''}${salesChange.toFixed(1)}%`,
        trend: salesChange > 0 ? 'up' : salesChange < 0 ? 'down' : 'neutral',
        label: 'vs last month'
      },
      inventoryValue: {
        value: `$${inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        change: '—',
        trend: 'neutral',
        label: 'current stock value'
      },
      pendingOrders: {
        value: String(pendingOrders),
        change: '',
        trend: pendingOrders > 10 ? 'up' : 'neutral',
        label: 'unpaid/partial'
      },
      activeEmployees: {
        value: String(activeEmployees),
        change: '',
        trend: 'neutral',
        label: 'on payroll'
      }
    };

    // ── Sales Trend (last 7 months) ──
    const salesTrend: { month: string; sales: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthName = monthStart.toLocaleString('en-US', { month: 'short' });

      const agg = await prisma.order.aggregate({
        _sum: { total: true },
        _count: true,
        where: { createdAt: { gte: monthStart, lte: monthEnd } }
      });

      salesTrend.push({
        month: monthName,
        sales: Math.round(agg._sum.total || 0),
        orders: agg._count || 0
      });
    }

    // ── Recent Activities (from real data) ──
    const [recentOrders, recentStock, recentPOs, recentEmployees, recentTransactions] = await Promise.all([
      prisma.order.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } }
      }),
      prisma.stockHistory.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true } } }
      }),
      prisma.purchaseOrder.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { supplier: { select: { name: true } } }
      }),
      prisma.employee.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const allActivities: any[] = [];

    recentOrders.forEach(o => {
      allActivities.push({
        id: `order-${o.id}`,
        type: 'sale',
        user: 'Farhat Sarwar',
        avatar: 'FS',
        message: `New sales order ${o.orderNumber} created for ${o.customer.name}`,
        amount: `$${o.total.toFixed(2)}`,
        time: timeAgo(o.createdAt),
        createdAt: o.createdAt
      });
    });

    recentStock.forEach(s => {
      allActivities.push({
        id: `stock-${s.id}`,
        type: 'inventory',
        user: 'Sarah Manager',
        avatar: 'SM',
        message: `${s.type === 'RESTOCK' ? 'Restocked' : s.type === 'SALE' ? 'Sold' : 'Adjusted'} ${Math.abs(s.change)} units of ${s.product.name}`,
        amount: `${s.change > 0 ? '+' : ''}${s.change}`,
        time: timeAgo(s.createdAt),
        createdAt: s.createdAt
      });
    });

    recentPOs.forEach(po => {
      allActivities.push({
        id: `po-${po.id}`,
        type: 'purchase',
        user: 'Sarah Manager',
        avatar: 'SM',
        message: `Restocked via Purchase Order ${po.orderNumber} from ${po.supplier.name}`,
        amount: `$${po.total.toFixed(2)}`,
        time: timeAgo(po.createdAt),
        createdAt: po.createdAt
      });
    });

    recentEmployees.forEach(e => {
      allActivities.push({
        id: `emp-${e.id}`,
        type: 'hr',
        user: 'Farhat Sarwar',
        avatar: 'FS',
        message: `Onboarded ${e.name} as ${e.position} (${e.department})`,
        amount: null,
        time: timeAgo(e.createdAt),
        createdAt: e.createdAt
      });
    });

    recentTransactions.forEach(t => {
      allActivities.push({
        id: `trans-${t.id}`,
        type: 'finance',
        user: 'Alice Accountant',
        avatar: 'AA',
        message: `Logged ${t.type.toLowerCase()} of $${t.amount.toFixed(2)}: ${t.category}`,
        amount: null,
        time: timeAgo(t.date),
        createdAt: t.date
      });
    });

    // Sort by date desc
    allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const activities = allActivities.slice(0, 6);

    res.json({
      role: req.user?.role,
      name: req.user?.name,
      stats,
      salesTrend,
      activities
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ message: 'Error retrieving dashboard stats' });
  }
};

export const getSalesForecast = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();

    // Get daily sales totals for last 90 days
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: ninetyDaysAgo } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    // Aggregate by week (last ~12 weeks)
    const weeklyData: { weekLabel: string; total: number; dayIndex: number }[] = [];
    for (let w = 12; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (w * 7));

      const weekOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d >= weekStart && d <= weekEnd;
      });

      const weekTotal = weekOrders.reduce((s, o) => s + o.total, 0);
      const label = `W${13 - w}`;
      weeklyData.push({ weekLabel: label, total: Math.round(weekTotal), dayIndex: 13 - w });
    }

    // Run linear regression on weekly data
    const points = weeklyData.map(w => ({ x: w.dayIndex, y: w.total }));
    const { slope, intercept } = linearRegression(points);

    // Generate 4-week forecast
    const forecast = [];
    const lastIdx = weeklyData.length;
    for (let f = 1; f <= 4; f++) {
      const predicted = Math.max(0, Math.round(slope * (lastIdx + f) + intercept));
      forecast.push({
        weekLabel: `F${f}`,
        predicted,
        lower: Math.max(0, Math.round(predicted * 0.85)),
        upper: Math.round(predicted * 1.15)
      });
    }

    // Build combined chart data
    const historical = weeklyData.slice(-8).map(w => ({
      label: w.weekLabel,
      actual: w.total,
      predicted: null as number | null,
    }));

    // Overlap: last historical point also starts forecast line
    const lastHistorical = historical[historical.length - 1];
    const combined = [
      ...historical,
      ...forecast.map(f => ({
        label: f.weekLabel,
        actual: null as number | null,
        predicted: f.predicted,
      }))
    ];

    // Set predicted on last historical point for continuity
    if (combined.length > 0 && lastHistorical) {
      const overlapIdx = combined.findIndex(c => c.label === lastHistorical.label);
      if (overlapIdx >= 0) {
        combined[overlapIdx].predicted = combined[overlapIdx].actual;
      }
    }

    res.json({
      chartData: combined,
      forecast,
      trendDirection: slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat',
      weeklyGrowthRate: slope > 0 && intercept > 0 ? `+${((slope / intercept) * 100).toFixed(1)}%` : `${((slope / Math.max(intercept, 1)) * 100).toFixed(1)}%`
    });
  } catch (error) {
    console.error('Error generating sales forecast:', error);
    res.status(500).json({ message: 'Error generating forecast' });
  }
};

// Helper: human-readable time ago
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export const getSystemLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    const formattedLogs = logs.map(log => ({
      id: log.id,
      timestamp: new Date(log.timestamp).toLocaleString('en-US', { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
      }).replace(',', ''),
      level: log.severity === 'INFO' ? 'INFO' : log.severity === 'WARNING' ? 'WARNING' : log.severity === 'ERROR' ? 'ERROR' : 'SUCCESS',
      module: log.module,
      user: log.userEmail || log.userId || 'System Automated',
      ip: log.ipAddress || 'localhost',
      action: log.action,
      details: log.description || ''
    }));

    res.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ message: 'Error retrieving system logs' });
  }
};

export const getBusinessHealthScore = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // 1. Inventory Turnover
    const products = await prisma.product.findMany({ select: { quantity: true, cost: true } });
    const currentInventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.cost), 0) || 1;
    const soldItems = await prisma.stockHistory.findMany({
      where: { type: 'SALE', createdAt: { gte: startOfThisMonth } },
      include: { product: { select: { cost: true } } }
    });
    const cogsThisMonth = soldItems.reduce((sum, s) => sum + (Math.abs(s.change) * s.product.cost), 0);
    const inventoryTurnover = (cogsThisMonth / currentInventoryValue);

    // 2. Sales Growth Trend
    const salesThisMonth = await prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: startOfThisMonth } }
    });
    const salesLastMonth = await prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } }
    });
    const currentSales = salesThisMonth._sum.total || 0;
    const prevSales = salesLastMonth._sum.total || 1; 
    const salesGrowth = (currentSales - prevSales) / prevSales; 

    // 3. Cash Flow Ratio
    const income = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'INCOME', date: { gte: startOfThisMonth } } });
    const expense = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'EXPENSE', date: { gte: startOfThisMonth } } });
    const totalIncome = income._sum.amount || 0;
    const totalExpense = expense._sum.amount || 0;
    const cashFlowRatio = totalExpense > 0 ? (totalIncome / totalExpense) : (totalIncome > 0 ? 2 : 1);

    // 4. Payment Collection Efficiency
    const paidOrders = await prisma.order.count({ where: { status: 'PAID' } });
    const allOrders = await prisma.order.count();
    const collectionEfficiency = allOrders > 0 ? (paidOrders / allOrders) : 1;

    // Calculate Scores (0-100 for each component)
    const turnoverScore = Math.min(100, Math.max(0, inventoryTurnover * 200));
    const growthScore = Math.min(100, Math.max(0, (salesGrowth + 0.2) * 100)); 
    const cashFlowScore = Math.min(100, Math.max(0, (cashFlowRatio - 0.5) * 100)); 
    const collectionScore = Math.min(100, Math.max(0, collectionEfficiency * 100)); 

    // Weighted Total Score
    const totalScore = Math.round((turnoverScore * 0.2) + (growthScore * 0.3) + (cashFlowScore * 0.3) + (collectionScore * 0.2));

    const metrics = {
      score: totalScore,
      factors: [
        { name: 'Inventory Turnover', value: turnoverScore, raw: `${(inventoryTurnover * 100).toFixed(1)}%`, impact: turnoverScore >= 70 ? 'positive' : turnoverScore <= 40 ? 'negative' : 'neutral' },
        { name: 'Sales Growth', value: growthScore, raw: `${(salesGrowth > 0 ? '+' : '')}${(salesGrowth * 100).toFixed(1)}%`, impact: growthScore >= 70 ? 'positive' : growthScore <= 40 ? 'negative' : 'neutral' },
        { name: 'Cash Flow Ratio', value: cashFlowScore, raw: `${cashFlowRatio.toFixed(2)}x`, impact: cashFlowScore >= 70 ? 'positive' : cashFlowScore <= 40 ? 'negative' : 'neutral' },
        { name: 'Collection Efficiency', value: collectionScore, raw: `${(collectionEfficiency * 100).toFixed(1)}%`, impact: collectionScore >= 70 ? 'positive' : collectionScore <= 40 ? 'negative' : 'neutral' }
      ]
    };

    let summary = '';
    const anthropic = getAnthropicClient();
    if (anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 300,
          system: `You are Bizloom's AI financial advisor. You receive 4 key business metrics and an overall health score (0-100). Write a 2-3 sentence natural language explanation of this score. Be direct, professional, and highlight the strongest and weakest areas based on the metrics. Do not include greetings.`,
          messages: [{ role: 'user', content: `Score: ${totalScore}/100\nMetrics: ${JSON.stringify(metrics.factors)}` }]
        });
        const textBlock = response.content.find((b: any) => b.type === 'text');
        summary = textBlock ? (textBlock as any).text : '';
      } catch (err) {
        console.error('AI summary error:', err);
      }
    }

    if (!summary) {
      const top = [...metrics.factors].sort((a, b) => b.value - a.value)[0];
      const bottom = [...metrics.factors].sort((a, b) => a.value - b.value)[0];
      summary = `Your overall business health score is ${totalScore}/100. This is primarily driven by strong ${top.name.toLowerCase()} (${top.raw}), but is currently being weighed down by ${bottom.name.toLowerCase()} (${bottom.raw}).`;
    }

    res.json({ ...metrics, summary });
  } catch (error) {
    console.error('Error calculating health score:', error);
    res.status(500).json({ message: 'Error retrieving health score' });
  }
};
