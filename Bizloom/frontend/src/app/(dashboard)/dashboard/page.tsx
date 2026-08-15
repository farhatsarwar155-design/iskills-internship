'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Target,
  CalendarClock,
  UserCheck,
  Trophy,
  Edit2,
  Check,
  X,
  ChevronRight,
  AlertTriangle,
  SlidersHorizontal,
  Eye,
  EyeOff,
} from 'lucide-react';

// Widget Components
import HealthScoreWidget from '@/components/dashboard/HealthScoreWidget';
import MiniCalendarWidget from '@/components/dashboard/MiniCalendarWidget';
import QuickInsightsWidget, { InsightItem } from '@/components/dashboard/QuickInsightsWidget';
import GoalMilestonesWidget, { MilestoneItem } from '@/components/dashboard/GoalMilestonesWidget';
import CashFlowWidget, { CashFlowData } from '@/components/dashboard/CashFlowWidget';
import CustomerInsightsWidget, { CustomerInsightsData } from '@/components/dashboard/CustomerInsightsWidget';
import LowStockPriorityWidget, { LowStockItem } from '@/components/dashboard/LowStockPriorityWidget';

const SalesChart = dynamic(() => import('@/components/dashboard/SalesChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 flex items-center justify-center bg-slate-50/50 dark:bg-neutral-900/30 rounded-xl animate-pulse">
      <div className="text-xs text-neutral-400 dark:text-neutral-500">Loading chart analytics...</div>
    </div>
  )
});

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  label: string;
}

interface ActivityItem {
  id: string;
  type: 'sale' | 'inventory' | 'purchase' | 'hr' | 'finance';
  message: string;
  amount: string | null;
  user: string;
  avatar: string;
  time: string;
}

interface DashboardData {
  role: string;
  name: string;
  stats: {
    totalSales: DashboardStats;
    inventoryValue: DashboardStats;
    pendingOrders: DashboardStats;
    activeEmployees: DashboardStats;
  };
  salesTrend: any[];
  activities: ActivityItem[];
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  relativeWidth: number;
}

interface UpcomingPayment {
  id: string;
  orderNumber: string;
  customer: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
  urgency: 'overdue' | 'due_soon' | 'upcoming';
}

interface AttendanceSnapshot {
  present: number;
  absent: number;
  onLeave: number;
  total: number;
}

interface SalesTarget {
  achieved: number;
  target: number;
  percentage: number;
}

interface WidgetData {
  greetingSummary: string;
  topProducts: TopProduct[];
  upcomingPayments: UpcomingPayment[];
  attendanceSnapshot: AttendanceSnapshot;
  salesTarget: SalesTarget;
  calendarEvents?: Record<string, any[]>;
  quickInsights?: InsightItem[];
  goalMilestones?: MilestoneItem[];
  cashFlowSnapshot?: CashFlowData;
  customerInsights?: CustomerInsightsData;
  lowStockPriority?: LowStockItem[];
}

interface WidgetVisibility {
  healthScore: boolean;
  salesTrend: boolean;
  topProducts: boolean;
  upcomingPayments: boolean;
  cashFlow: boolean;
  customerInsights: boolean;
  attendance: boolean;
  recentActivity: boolean;
  miniCalendar: boolean;
  quickInsights: boolean;
  salesTarget: boolean;
  goalMilestones: boolean;
  lowStockPriority: boolean;
}

const DEFAULT_VISIBILITY: WidgetVisibility = {
  healthScore: true,
  salesTrend: true,
  topProducts: true,
  upcomingPayments: true,
  cashFlow: true,
  customerInsights: true,
  attendance: true,
  recentActivity: true,
  miniCalendar: true,
  quickInsights: true,
  salesTarget: true,
  goalMilestones: true,
  lowStockPriority: true,
};

// ── Attendance Donut Chart ───────────────────────────────────────────────────
function AttendanceDonut({ present, absent, onLeave, total }: AttendanceSnapshot) {
  const safeTotal = total || 1;
  const presentPct = (present / safeTotal) * 100;
  const absentPct = (absent / safeTotal) * 100;
  const leavePct = (onLeave / safeTotal) * 100;

  const C = 188.5;
  const presentDash = (presentPct / 100) * C;
  const absentDash = (absentPct / 100) * C;
  const leaveDash = (leavePct / 100) * C;

  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="10" className="text-neutral-100 dark:text-neutral-800" />
        {present > 0 && (
          <circle cx="40" cy="40" r="30" fill="none" stroke="#10b981" strokeWidth="10"
            strokeDasharray={`${presentDash} ${C - presentDash}`} strokeDashoffset={0} strokeLinecap="butt" />
        )}
        {absent > 0 && (
          <circle cx="40" cy="40" r="30" fill="none" stroke="#f43f5e" strokeWidth="10"
            strokeDasharray={`${absentDash} ${C - absentDash}`} strokeDashoffset={-presentDash} strokeLinecap="butt" />
        )}
        {onLeave > 0 && (
          <circle cx="40" cy="40" r="30" fill="none" stroke="#f59e0b" strokeWidth="10"
            strokeDasharray={`${leaveDash} ${C - leaveDash}`} strokeDashoffset={-(presentDash + absentDash)} strokeLinecap="butt" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-neutral-800 dark:text-neutral-100">{total}</span>
        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Total</span>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [widgets, setWidgets] = useState<WidgetData | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [localTarget, setLocalTarget] = useState<number | null>(null);

  // Widget visibility state & modal
  const [visibility, setVisibility] = useState<WidgetVisibility>(DEFAULT_VISIBILITY);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  useEffect(() => {
    // Load stored widget preferences
    try {
      const stored = localStorage.getItem('bizloom_dashboard_widget_visibility');
      if (stored) setVisibility(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load dashboard preferences', e);
    }
  }, []);

  const toggleWidget = (key: keyof WidgetVisibility) => {
    const updated = { ...visibility, [key]: !visibility[key] };
    setVisibility(updated);
    try {
      localStorage.setItem('bizloom_dashboard_widget_visibility', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save dashboard preferences', e);
    }
  };

  const resetWidgetVisibility = () => {
    setVisibility(DEFAULT_VISIBILITY);
    localStorage.removeItem('bizloom_dashboard_widget_visibility');
    toast.success('Dashboard layout restored to default');
  };

  const canViewForecast = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';

  const fetchDashboard = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const requests: Promise<any>[] = [
        api.get('/dashboard'),
        api.get('/dashboard/widgets'),
      ];
      // Only fetch forecast for roles that have backend access
      if (canViewForecast) {
        requests.push(api.get('/dashboard/forecast').catch(() => null));
      }

      const results = await Promise.all(requests);
      setData(results[0].data);
      setWidgets(results[1].data);
      if (canViewForecast && results[2]) setForecast(results[2].data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to connect to backend server');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (showToast) toast.success('Dashboard metrics refreshed');
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSync = () => fetchDashboard(true);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const next30DaysForecast = forecast?.forecast?.reduce((sum: number, f: any) => sum + f.predicted, 0) || 0;

  // ── Stat Card Renderer ─────────────────────────────────────────────────────
  const renderStatCard = (title: string, value: string, icon: any, stats: DashboardStats, colorClass: string, delayIdx: number) => {
    const Icon = icon;
    const isUp = stats.trend === 'up';
    const isDown = stats.trend === 'down';
    return (
      <Card
        className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 overflow-hidden group animate-fade-slide-up"
        style={{ animationDelay: `${delayIdx * 0.1}s` }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{title}</span>
            <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 dark:bg-opacity-20 transition-colors group-hover:scale-110 duration-200`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{value}</h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
              {isUp && (
                <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {stats.change}
                </span>
              )}
              {isDown && (
                <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                  <TrendingDown className="h-3.5 w-3.5" />
                  {stats.change}
                </span>
              )}
              {stats.trend === 'neutral' && (
                <span className="text-neutral-500 dark:text-neutral-400">{stats.change}</span>
              )}
              <span className="text-neutral-400 dark:text-neutral-500 font-medium">{stats.label}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ── Full Dashboard Loading Skeleton ────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 w-full bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 p-6 rounded-2xl animate-pulse space-y-2">
          <div className="h-7 w-64 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-4 w-96 bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-2xl border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 animate-pulse p-6">
              <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
              <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 rounded-2xl border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 animate-pulse p-6 h-80" />
          <Card className="rounded-2xl border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 animate-pulse p-6 h-80" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/70 rounded-2xl text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 mb-4 animate-bounce">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-neutral-800 dark:text-white">ERP Backend Unreachable</h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
          Please ensure the local database and Express server are running.
        </p>
        <Button onClick={handleSync} className="mt-6 h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />Retry Connection
        </Button>
      </div>
    );
  }

  const effectiveTarget = localTarget ?? widgets?.salesTarget?.target ?? 50000;
  const effectiveAchieved = widgets?.salesTarget?.achieved ?? 0;
  const effectivePct = Math.min(100, Math.round((effectiveAchieved / effectiveTarget) * 100));
  const targetBarColor = effectivePct >= 90 ? 'bg-emerald-500' : effectivePct >= 50 ? 'bg-indigo-500' : 'bg-amber-500';

  const urgencyConfig = {
    overdue: { label: 'Overdue', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50' },
    due_soon: { label: 'Due Soon', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' },
    upcoming: { label: 'Upcoming', color: 'text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700/50' },
  };

  const role = user?.role || 'EMPLOYEE';
  const canSeeUpcomingPayments = ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(role);
  const canSeeCustomerInsights = ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(role);
  const canSeeAttendance = ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role);
  const canSeeLowStock = ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role);
  const canSeeCashFlow = ['ADMIN', 'ACCOUNTANT'].includes(role);

  const showUpcoming = canSeeUpcomingPayments && visibility.upcomingPayments;
  const showTopProducts = visibility.topProducts;
  const showCashFlow = canSeeCashFlow && visibility.cashFlow;
  const showCustomerInsights = canSeeCustomerInsights && visibility.customerInsights;
  const showAttendance = canSeeAttendance && visibility.attendance;
  const showLowStock = canSeeLowStock && visibility.lowStockPriority;
  const showSalesTarget = visibility.salesTarget;
  const showGoalMilestones = visibility.goalMilestones;

  return (
    <div className="space-y-6 pb-12">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}} />

      {/* ── ROW 1: PERSONALIZED GREETING HEADER ─────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-slide-up" style={{ animationDelay: '0s' }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              {greeting}, {data.name} 👋
            </h1>
            <div className="flex h-6 items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              {role}
            </div>
          </div>
          <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500 font-medium">{formattedDate}</p>
          {widgets?.greetingSummary && (
            <p className="mt-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 max-w-2xl flex items-start gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
              {widgets.greetingSummary}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCustomizeModal(true)}
            variant="outline"
            className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
            Customize Layout
          </Button>
          <Button
            onClick={handleSync}
            disabled={refreshing}
            variant="outline"
            className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync ERP Data
          </Button>
        </div>
      </div>

      {/* ── ROW 2: 4 TREND-AWARE STAT CARDS ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {renderStatCard('Total Sales', data.stats.totalSales.value, DollarSign, data.stats.totalSales, 'text-indigo-600 dark:text-indigo-400', 1)}
        {renderStatCard('Inventory Value', data.stats.inventoryValue.value, Package, data.stats.inventoryValue, 'text-amber-500 dark:text-amber-400', 2)}
        {renderStatCard('Pending Orders', data.stats.pendingOrders.value, ShoppingCart, data.stats.pendingOrders, 'text-emerald-500', 3)}
        {renderStatCard('Active Staff', data.stats.activeEmployees.value, Users, data.stats.activeEmployees, 'text-sky-500', 4)}
      </div>

      {/* ── ROW 3: SALES TREND CHART + AI BUSINESS HEALTH SCORE ─────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {visibility.salesTrend && (
          <Card className="lg:col-span-2 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm animate-fade-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/50">
              <div>
                <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Revenue & Orders Trend</CardTitle>
                <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">
                  {showForecast ? 'Combined historical and 4-week AI predictions.' : 'Revenue and volume over the last 7 months.'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {forecast && (
                  <button
                    onClick={() => setShowForecast(!showForecast)}
                    className={`px-3 py-1 rounded-xl text-2xs font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                      showForecast
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    {showForecast ? 'Hide Forecast' : 'AI Forecast'}
                  </button>
                )}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-indigo-900/10">
                  <TrendingUp className="h-3 w-3" />
                  Growth Enabled
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <SalesChart data={showForecast && forecast ? forecast.chartData : data.salesTrend} />
            </CardContent>
          </Card>
        )}

        {visibility.healthScore && (
          <div className={`${visibility.salesTrend ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
            <HealthScoreWidget />
          </div>
        )}
      </div>

      {/* ── ROW 4: TOP PRODUCTS + UPCOMING PAYMENTS ──────────────────────── */}
      {widgets && (showTopProducts || showUpcoming) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {showTopProducts && (
            <Card className={`${showUpcoming ? 'lg:col-span-2' : 'lg:col-span-3'} rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm animate-fade-slide-up`} style={{ animationDelay: '0.4s' }}>
              <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Top Products This Month
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Best-selling items by units sold.</CardDescription>
                </div>
                <Link href="/dashboard/sales" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5">
                  View Sales <ChevronRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5">
                {widgets.topProducts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-400">No sales recorded this month.</div>
                ) : widgets.topProducts.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className={`text-[10px] font-black w-4 shrink-0 ${idx === 0 ? 'text-amber-500' : 'text-neutral-400'}`}>#{idx + 1}</span>
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 ${
                      ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-pink-500'][idx]
                    }`}>
                      {product.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{product.name}</span>
                        <span className="text-xs font-black text-neutral-500 dark:text-neutral-400 shrink-0 ml-2">{product.unitsSold} units</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-pink-500'][idx]
                          }`}
                          style={{ width: `${product.relativeWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {showUpcoming && (
            <Card className={`${showTopProducts ? 'lg:col-span-1' : 'lg:col-span-3'} rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm animate-fade-slide-up`} style={{ animationDelay: '0.45s' }}>
              <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4 text-rose-500" />
                    Upcoming Payments
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Invoices due in 7 days.</CardDescription>
                </div>
                <Link href="/dashboard/sales" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5">
                  View All <ChevronRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-5">
                {widgets.upcomingPayments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-400 flex flex-col items-center gap-2">
                    <CalendarClock className="h-6 w-6 text-neutral-300" />
                    No payments due in the next 7 days.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {widgets.upcomingPayments.map(payment => {
                      const cfg = urgencyConfig[payment.urgency];
                      return (
                        <Link
                          key={payment.id}
                          href={`/dashboard/sales?order=${payment.orderNumber}`}
                          className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/70 bg-slate-50/50 dark:bg-neutral-900/50 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {payment.urgency === 'overdue' && <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{payment.customer}</p>
                              <p className="text-[10px] text-neutral-400">{payment.orderNumber} · Due {payment.dueDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                              ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── ROW 5: CASH FLOW + CUSTOMER INSIGHTS + ATTENDANCE SNAPSHOT ──── */}
      {widgets && (showCashFlow || showCustomerInsights || showAttendance) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {showCashFlow && <CashFlowWidget data={widgets.cashFlowSnapshot} />}
          {showCustomerInsights && <CustomerInsightsWidget data={widgets.customerInsights} />}
          {showAttendance && (
            <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm animate-fade-slide-up" style={{ animationDelay: '0.55s' }}>
              <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                    Today's Attendance
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Real-time snapshot.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-5 flex flex-col items-center gap-4">
                <AttendanceDonut {...widgets.attendanceSnapshot} />
                <div className="w-full space-y-2">
                  {[
                    { label: 'Present', value: widgets.attendanceSnapshot.present, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Absent', value: widgets.attendanceSnapshot.absent, color: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
                    { label: 'On Leave', value: widgets.attendanceSnapshot.onLeave, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${item.color}`} />
                        <span className="text-neutral-500 dark:text-neutral-400 font-medium">{item.label}</span>
                      </div>
                      <span className={`font-black ${item.text}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/hr" className="w-full text-center text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center justify-center gap-0.5 mt-1">
                  View Full Attendance <ChevronRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── ROW 6: RECENT ACTIVITY + MINI CALENDAR + QUICK INSIGHTS ─────── */}
      {visibility.recentActivity || (widgets && (visibility.miniCalendar || visibility.quickInsights)) ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibility.recentActivity && (
            <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col animate-fade-slide-up" style={{ animationDelay: '0.6s' }}>
              <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50">
                <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Recent Activity</CardTitle>
                <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Live audit log of ERP events.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-y-auto max-h-[340px] scrollbar-thin">
                {data.activities.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                    <Clock className="h-8 w-8 text-neutral-300 mb-2" />
                    <span className="text-xs text-neutral-400">No activities recorded yet</span>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-100 dark:bg-neutral-800" />
                    <div className="space-y-0">
                      {data.activities.map((activity) => {
                        const typeConfig = {
                          sale: { color: 'bg-indigo-100 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/30', dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400', label: 'Sale' },
                          inventory: { color: 'bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/30', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', label: 'Stock' },
                          purchase: { color: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/30', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', label: 'Purchase' },
                          hr: { color: 'bg-violet-100 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900/30', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400', label: 'HR' },
                          finance: { color: 'bg-rose-100 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/30', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400', label: 'Finance' },
                        };
                        const cfg = typeConfig[activity.type] || typeConfig.sale;
                        return (
                          <div key={activity.id} className="relative flex gap-4 pb-5 last:pb-0 pl-2">
                            <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black text-neutral-700 dark:text-neutral-300 shadow-sm ${cfg.color}`}>
                              {activity.avatar}
                              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-neutral-900 ${cfg.dot}`} />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${cfg.badge}`}>{cfg.label}</span>
                                <span className="text-[10px] font-semibold text-neutral-400 shrink-0">{activity.time}</span>
                              </div>
                              <p className="mt-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed">{activity.message}</p>
                              {activity.amount && (
                                <span className={`mt-0.5 inline-block text-xs font-extrabold ${String(activity.amount).startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-800 dark:text-neutral-200'}`}>{activity.amount}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {widgets && visibility.miniCalendar && <MiniCalendarWidget events={widgets.calendarEvents} />}
          {widgets && visibility.quickInsights && <QuickInsightsWidget insights={widgets.quickInsights} />}
        </div>
      ) : null}

      {/* ── ROW 7: SALES TARGET + GOAL MILESTONES + LOW STOCK PRIORITY ──── */}
      {widgets && (showSalesTarget || showGoalMilestones || showLowStock) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {showSalesTarget && (
            <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm animate-fade-slide-up" style={{ animationDelay: '0.65s' }}>
              <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-indigo-500" />
                    Monthly Sales Target
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Progress vs. goal.</CardDescription>
                </div>
                {role === 'ADMIN' && (
                  <button
                    onClick={() => { setEditingTarget(true); setTargetInput(String(effectiveTarget)); }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-black text-neutral-900 dark:text-white">{effectivePct}%</span>
                    <span className="text-xs text-neutral-400 ml-1">of goal</span>
                  </div>
                  {editingTarget && role === 'ADMIN' ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={targetInput}
                        onChange={e => setTargetInput(e.target.value)}
                        className="w-24 h-7 text-xs px-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 font-bold"
                        autoFocus
                      />
                      <button onClick={() => { setLocalTarget(Number(targetInput)); setEditingTarget(false); }} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditingTarget(false)} className="p-1 text-rose-500 hover:bg-rose-50 rounded">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-neutral-400">Target: ${effectiveTarget.toLocaleString()}</span>
                  )}
                </div>
                <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${targetBarColor}`}
                    style={{ width: `${effectivePct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500 font-medium">
                    ${effectiveAchieved.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} achieved
                  </span>
                  <span className={`font-bold ${effectivePct >= 90 ? 'text-emerald-600' : effectivePct >= 50 ? 'text-indigo-600' : 'text-amber-600'}`}>
                    {effectivePct >= 100 ? '🎉 Target Met!' : effectivePct >= 90 ? 'Almost there!' : effectivePct >= 50 ? 'On track' : 'Needs attention'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {showGoalMilestones && <GoalMilestonesWidget milestones={widgets.goalMilestones} />}
          {showLowStock && <LowStockPriorityWidget items={widgets.lowStockPriority} />}
        </div>
      )}

      {/* ── BOTTOM: AI SALES FORECAST ─────────────────────────────────────── */}
      {forecast && (
        <Card className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/20 dark:from-neutral-900 dark:to-neutral-900/50 shadow-sm p-6 animate-fade-slide-up" style={{ animationDelay: '0.75s' }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/30 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                AI Sales Forecasting Active
              </div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight">AI 30-Day Sales Forecast</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-semibold">
                Using a <b>Simple Linear Regression model</b> trained on historical sales from the last 90 days.
              </p>
            </div>
            <div className="flex items-center gap-6 shrink-0 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 p-4 rounded-xl shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">Predicted Next 30 Days</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                  ${next30DaysForecast.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-l border-neutral-100 dark:border-neutral-800 h-10" />
              <div className="space-y-1">
                <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">Projected Trend</span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                  forecast.trendDirection === 'up' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {forecast.trendDirection === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {forecast.trendDirection === 'up' ? 'GROWTH' : 'DECLINE'} ({forecast.weeklyGrowthRate})
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── CUSTOMIZE DASHBOARD MODAL ────────────────────────────────────── */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-slide-up">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-indigo-500" />
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Customize Dashboard Layout</h3>
              </div>
              <button onClick={() => setShowCustomizeModal(false)} className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Toggle widget visibility to customize your workspace view. Preferences are automatically saved.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {[
                { key: 'healthScore', label: 'AI Business Health Score', allowed: true },
                { key: 'salesTrend', label: 'Revenue & Orders Trend Chart', allowed: true },
                { key: 'topProducts', label: 'Top Products Leaderboard', allowed: true },
                { key: 'upcomingPayments', label: 'Upcoming Payments', allowed: canSeeUpcomingPayments },
                { key: 'cashFlow', label: 'Cash Flow Snapshot', allowed: canSeeCashFlow },
                { key: 'customerInsights', label: 'Customer Insights', allowed: canSeeCustomerInsights },
                { key: 'attendance', label: "Today's Attendance Snapshot", allowed: canSeeAttendance },
                { key: 'recentActivity', label: 'Recent Activity Feed', allowed: true },
                { key: 'miniCalendar', label: 'Mini Calendar & Schedule', allowed: true },
                { key: 'quickInsights', label: 'Quick Data Insights', allowed: true },
                { key: 'salesTarget', label: 'Monthly Sales Target', allowed: true },
                { key: 'goalMilestones', label: 'Goal Milestones Tracker', allowed: true },
                { key: 'lowStockPriority', label: 'Low Stock Priority List', allowed: canSeeLowStock },
              ].filter(item => item.allowed).map(item => {
                const k = item.key as keyof WidgetVisibility;
                const isVisible = visibility[k];
                return (
                  <label
                    key={k}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => toggleWidget(k)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        isVisible
                          ? 'bg-indigo-500 text-white shadow-xs'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {isVisible ? 'Visible' : 'Hidden'}
                    </button>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={resetWidgetVisibility}
                className="text-xs font-bold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                Reset Defaults
              </button>
              <Button
                onClick={() => setShowCustomizeModal(false)}
                className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
