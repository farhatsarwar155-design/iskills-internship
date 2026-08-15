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

export const getDashboardWidgets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. GREETING SUMMARY DATA (real counts)
    const [pendingInvoiceCount, lowStockCount, pendingPOCount] = await Promise.all([
      prisma.order.count({ where: { status: { in: ['UNPAID', 'PARTIAL'] } } }),
      prisma.product.count({ where: { quantity: { lte: 5 } } }),
      prisma.purchaseOrder.count({ where: { status: 'PENDING' } })
    ]);
    const greetingSummary = `You have ${pendingInvoiceCount} pending invoice${pendingInvoiceCount !== 1 ? 's' : ''}, ${lowStockCount} low-stock item${lowStockCount !== 1 ? 's' : ''}, and ${pendingPOCount} purchase order${pendingPOCount !== 1 ? 's' : ''} awaiting approval.`;

    // 2. TOP PRODUCTS THIS MONTH
    const orderItemsThisMonth = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: startOfMonth } } },
      include: { product: { select: { id: true, name: true, category: true } } }
    });
    const productSalesMap: Record<string, { name: string; category: string; unitsSold: number }> = {};
    for (const item of orderItemsThisMonth) {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.product.name, category: item.product.category, unitsSold: 0 };
      }
      productSalesMap[item.productId].unitsSold += item.quantity;
    }
    const topProducts = Object.entries(productSalesMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
    const maxUnits = topProducts[0]?.unitsSold || 1;

    // 3. UPCOMING PAYMENTS (orders due within 7 days or overdue)
    const unpaidOrders = await prisma.order.findMany({
      where: { status: { in: ['UNPAID', 'PARTIAL'] } },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
      take: 8
    });
    const upcomingPayments = unpaidOrders.map(order => {
      // Estimate due date: createdAt + 30 days (standard NET 30)
      const dueDate = new Date(order.createdAt);
      if (order.paymentTerms === 'NET 15') dueDate.setDate(dueDate.getDate() + 15);
      else if (order.paymentTerms === 'NET 60') dueDate.setDate(dueDate.getDate() + 60);
      else dueDate.setDate(dueDate.getDate() + 30);

      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      let urgency: 'overdue' | 'due_soon' | 'upcoming' = 'upcoming';
      if (daysUntilDue < 0) urgency = 'overdue';
      else if (daysUntilDue <= 3) urgency = 'due_soon';

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer.name,
        amount: order.total,
        dueDate: dueDate.toISOString().split('T')[0],
        daysUntilDue,
        urgency
      };
    }).filter(p => p.daysUntilDue <= 7).sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    // 4. TODAY'S ATTENDANCE SNAPSHOT
    const todayAttendance = await prisma.attendance.findMany({
      where: { date: { gte: startOfToday, lte: endOfToday } }
    });
    const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });
    const presentCount = todayAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const absentCount = todayAttendance.filter(a => a.status === 'ABSENT').length;
    const leaveCount = totalEmployees - presentCount - absentCount;
    const attendanceSnapshot = {
      present: presentCount,
      absent: absentCount,
      onLeave: Math.max(0, leaveCount),
      total: totalEmployees
    };

    // 5. MONTHLY SALES TARGET
    const salesThisMonth = await prisma.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: { createdAt: { gte: startOfMonth } }
    });
    const achievedSales = salesThisMonth._sum.total || 0;
    const orderCountThisMonth = salesThisMonth._count || 0;
    const DEFAULT_TARGET = 50000;
    const salesTarget = {
      achieved: achievedSales,
      target: DEFAULT_TARGET,
      percentage: Math.min(100, Math.round((achievedSales / DEFAULT_TARGET) * 100))
    };

    // 6. MINI CALENDAR EVENTS
    // Fetch unpaid order due dates, pending PO dates, and attendance leave records for current month
    const calendarEvents: Record<string, { type: 'invoice' | 'leave' | 'purchase'; title: string; detail: string }[]> = {};

    unpaidOrders.forEach(order => {
      const dueDate = new Date(order.createdAt);
      if (order.paymentTerms === 'NET 15') dueDate.setDate(dueDate.getDate() + 15);
      else if (order.paymentTerms === 'NET 60') dueDate.setDate(dueDate.getDate() + 60);
      else dueDate.setDate(dueDate.getDate() + 30);

      const dateStr = dueDate.toISOString().split('T')[0];
      if (!calendarEvents[dateStr]) calendarEvents[dateStr] = [];
      calendarEvents[dateStr].push({
        type: 'invoice',
        title: `Invoice Due: ${order.orderNumber}`,
        detail: `${order.customer} - $${order.total.toFixed(2)}`
      });
    });

    const pendingPOs = await prisma.purchaseOrder.findMany({
      where: { status: 'PENDING' },
      include: { supplier: { select: { name: true } } },
      take: 10
    });
    pendingPOs.forEach(po => {
      const expectedDate = new Date(po.createdAt);
      expectedDate.setDate(expectedDate.getDate() + 7); // Estimated 7 days delivery
      const dateStr = expectedDate.toISOString().split('T')[0];
      if (!calendarEvents[dateStr]) calendarEvents[dateStr] = [];
      calendarEvents[dateStr].push({
        type: 'purchase',
        title: `PO Expected: ${po.orderNumber}`,
        detail: `${po.supplier.name} - $${po.total.toFixed(2)}`
      });
    });

    const leaveAttendance = await prisma.attendance.findMany({
      where: { status: 'ABSENT' },
      include: { employee: { select: { name: true } } },
      take: 10
    });
    leaveAttendance.forEach(att => {
      const dateStr = new Date(att.date).toISOString().split('T')[0];
      if (!calendarEvents[dateStr]) calendarEvents[dateStr] = [];
      calendarEvents[dateStr].push({
        type: 'leave',
        title: `Employee Leave`,
        detail: `${att.employee.name} (Absent/On Leave)`
      });
    });

    // 7. QUICK INSIGHTS
    const quickInsights: { id: string; type: 'growth' | 'warning' | 'peak'; icon: string; title: string; description: string }[] = [];

    // Insight 1: Top sales category
    const categoryAgg: Record<string, number> = {};
    orderItemsThisMonth.forEach(item => {
      const cat = item.product.category || 'General';
      categoryAgg[cat] = (categoryAgg[cat] || 0) + (item.price * item.quantity);
    });
    const topCat = Object.entries(categoryAgg).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      quickInsights.push({
        id: 'top-cat',
        type: 'growth',
        icon: 'TrendingUp',
        title: `${topCat[0]} Category Leading`,
        description: `Generated $${topCat[1].toLocaleString(undefined, { minimumFractionDigits: 2 })} in sales this month.`
      });
    }

    // Insight 2: Inactive customers (no orders in last 60 days)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const activeCustomerIds = (await prisma.order.findMany({
      where: { createdAt: { gte: sixtyDaysAgo } },
      select: { customerId: true }
    })).map(o => o.customerId);
    const inactiveCount = await prisma.customer.count({
      where: { id: { notIn: activeCustomerIds } }
    });
    quickInsights.push({
      id: 'inactive-cust',
      type: 'warning',
      icon: 'AlertTriangle',
      title: `${inactiveCount} Inactive Customers`,
      description: `Haven't placed an order in 60+ days. Consider sending a re-engagement offer.`
    });

    // Insight 3: Peak sales day this month
    const ordersThisMonth = await prisma.order.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { total: true, createdAt: true }
    });
    const daySalesMap: Record<string, number> = {};
    ordersThisMonth.forEach(o => {
      const dayStr = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daySalesMap[dayStr] = (daySalesMap[dayStr] || 0) + o.total;
    });
    const peakDay = Object.entries(daySalesMap).sort((a, b) => b[1] - a[1])[0];
    if (peakDay) {
      quickInsights.push({
        id: 'peak-day',
        type: 'peak',
        icon: 'Calendar',
        title: `Peak Sales Day: ${peakDay[0]}`,
        description: `Highest revenue recorded in a single day ($${peakDay[1].toLocaleString(undefined, { minimumFractionDigits: 2 })}).`
      });
    } else {
      quickInsights.push({
        id: 'peak-day',
        type: 'peak',
        icon: 'Calendar',
        title: `Sales Activity Stable`,
        description: `Consistent order volume across the current billing period.`
      });
    }

    // 8. GOAL MILESTONES TRACKER
    const activeProductCount = await prisma.product.count();
    const goalMilestones = [
      {
        id: 'm1',
        title: 'Monthly Revenue Goal',
        target: DEFAULT_TARGET,
        current: Math.round(achievedSales),
        unit: '$',
        isCurrency: true,
      },
      {
        id: 'm2',
        title: 'Monthly Order Count',
        target: 50,
        current: orderCountThisMonth,
        unit: 'orders',
        isCurrency: false,
      },
      {
        id: 'm3',
        title: 'Active Catalog Size',
        target: 20,
        current: activeProductCount,
        unit: 'products',
        isCurrency: false,
      }
    ];

    // 9. CASH FLOW SNAPSHOT (last 6 months)
    const cashFlowHistory = [];
    let grandTotalIncome = 0;
    let grandTotalExpense = 0;

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = monthStart.toLocaleString('en-US', { month: 'short' });

      const incomeAgg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'INCOME', date: { gte: monthStart, lte: monthEnd } }
      });
      const expenseAgg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } }
      });

      const inc = incomeAgg._sum.amount || 0;
      const exp = expenseAgg._sum.amount || 0;
      grandTotalIncome += inc;
      grandTotalExpense += exp;

      cashFlowHistory.push({
        month: monthLabel,
        income: Math.round(inc),
        expense: Math.round(exp)
      });
    }
    const netCashFlow = grandTotalIncome - grandTotalExpense;

    const cashFlowSnapshot = {
      history: cashFlowHistory,
      totalIncome: grandTotalIncome,
      totalExpense: grandTotalExpense,
      netCashFlow
    };

    // 10. CUSTOMER INSIGHTS
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const newCustomersThisMonth = await prisma.customer.count({
      where: { createdAt: { gte: startOfMonth } }
    });
    const newCustomersLastMonth = await prisma.customer.count({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
    });
    const customerTrendPct = newCustomersLastMonth > 0
      ? Math.round(((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100)
      : (newCustomersThisMonth > 0 ? 100 : 0);

    // Top Customer by total spend
    const customerSpendAgg = await prisma.order.groupBy({
      by: ['customerId'],
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 1
    });
    let topCustomer = { name: 'N/A', totalSpent: 0 };
    if (customerSpendAgg.length > 0) {
      const cust = await prisma.customer.findUnique({
        where: { id: customerSpendAgg[0].customerId },
        select: { name: true }
      });
      if (cust) {
        topCustomer = { name: cust.name, totalSpent: customerSpendAgg[0]._sum.total || 0 };
      }
    }

    // Repeat customer rate
    const totalCustomersCount = await prisma.customer.count();
    const customerOrderCounts = await prisma.order.groupBy({
      by: ['customerId'],
      _count: { id: true }
    });
    const repeatCustomersCount = customerOrderCounts.filter(c => c._count.id > 1).length;
    const repeatCustomerRate = totalCustomersCount > 0
      ? Math.round((repeatCustomersCount / totalCustomersCount) * 100)
      : 0;

    const customerInsights = {
      newCustomers: newCustomersThisMonth,
      customerTrendPct,
      topCustomer,
      repeatCustomerRate
    };

    // 11. LOW STOCK PRIORITY LIST
    const lowStockProducts = await prisma.product.findMany({
      where: { quantity: { lte: 10 } },
      orderBy: { quantity: 'asc' },
      take: 5,
      select: { id: true, name: true, sku: true, quantity: true, minStockLevel: true, cost: true }
    });

    const lowStockPriority = lowStockProducts.map(p => {
      let urgency: 'Critical' | 'Low' | 'Watch' = 'Watch';
      if (p.quantity === 0) urgency = 'Critical';
      else if (p.quantity <= p.minStockLevel) urgency = 'Low';

      const suggestedReorder = Math.max(10, (p.minStockLevel * 2) - p.quantity);

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
        minStockLevel: p.minStockLevel,
        urgency,
        suggestedReorder
      };
    });

    res.json({
      greetingSummary,
      topProducts: topProducts.map(p => ({ ...p, relativeWidth: Math.round((p.unitsSold / maxUnits) * 100) })),
      upcomingPayments,
      attendanceSnapshot,
      salesTarget,
      calendarEvents,
      quickInsights,
      goalMilestones,
      cashFlowSnapshot,
      customerInsights,
      lowStockPriority
    });
  } catch (error) {
    console.error('Error fetching dashboard widgets:', error);
    res.status(500).json({ message: 'Error retrieving dashboard widgets' });
  }
};
