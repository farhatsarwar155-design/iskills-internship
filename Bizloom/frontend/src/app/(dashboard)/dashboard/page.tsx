'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

import HealthScoreWidget from '@/components/dashboard/HealthScoreWidget';

// Dynamically import Recharts to avoid SSR hydration warnings
const SalesChart = dynamic(() => import('@/components/dashboard/SalesChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 flex items-center justify-center bg-slate-50/50 dark:bg-neutral-900/30 rounded-xl animate-pulse">
      <div className="text-xs text-neutral-400 dark:text-neutral-500">Loading chart analytics...</div>
    </div>
  )
});

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

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to connect to the backend server');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (showToast) {
        toast.success('Dashboard metrics refreshed');
      }
    }
  };

  const fetchForecast = async () => {
    try {
      const response = await api.get('/dashboard/forecast');
      setForecast(response.data);
    } catch (err) {
      console.error('Failed to fetch sales forecast', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchForecast();
  }, []);

  const handleSync = () => {
    fetchDashboard(true);
    fetchForecast();
  };

  // Render Stat Card helper
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

  // Render Skeletons for Stat Cards
  const renderCardSkeletons = () => (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="rounded-2xl border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 animate-pulse">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-3.5 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render Skeletons for Main Area
  const renderMainSkeletons = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
      <Card className="lg:col-span-2 rounded-2xl border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 animate-pulse p-6">
        <div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-800 rounded mb-6" />
        <div className="h-80 w-full bg-neutral-200/60 dark:bg-neutral-800/40 rounded-xl" />
      </Card>
      <Card className="rounded-2xl border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 animate-pulse p-6">
        <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-6" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // Render Empty/Error state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/70 rounded-2xl text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 mb-4 animate-bounce">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-neutral-800 dark:text-white">ERP Backend Unreachable</h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
        Please ensure the local database and Node.js Express backend are running, and database migrations are up to date.
      </p>
      <Button
        onClick={handleSync}
        className="mt-6 h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        <RefreshCw className="h-4 w-4" />
        Retry Connection
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
        </div>
        {renderCardSkeletons()}
        {renderMainSkeletons()}
      </div>
    );
  }

  if (!data) {
    return renderEmptyState();
  }

  // Get current date representation
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate next 30 days predicted forecast total
  const next30DaysForecast = forecast?.forecast?.reduce((sum: number, f: any) => sum + f.predicted, 0) || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Global CSS for animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-slide-up {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}} />
      
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-slide-up" style={{ animationDelay: '0s' }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              Dashboard
            </h1>
            <div className="flex h-6 items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              {data.role} Account
            </div>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Welcome back, <span className="text-neutral-800 dark:text-neutral-200">{data.name}</span>. Today is {formattedDate}
          </p>
        </div>
        <div>
          <Button
            onClick={handleSync}
            disabled={refreshing}
            variant="outline"
            className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sync ERP Data
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {renderStatCard('Total Sales', data.stats.totalSales.value, DollarSign, data.stats.totalSales, 'text-indigo-600 dark:text-indigo-400', 1)}
        {renderStatCard('Inventory Value', data.stats.inventoryValue.value, Package, data.stats.inventoryValue, 'text-amber-500 dark:text-amber-400', 2)}
        {renderStatCard('Pending Orders', data.stats.pendingOrders.value, ShoppingCart, data.stats.pendingOrders, 'text-emerald-500', 3)}
        {renderStatCard('Active Staff', data.stats.activeEmployees.value, Users, data.stats.activeEmployees, 'text-sky-500', 4)}
      </div>

      {/* AI Business Health Score Widget */}
      <div className="grid grid-cols-1 mb-6">
        <HealthScoreWidget />
      </div>

      {/* Main Grid: Recharts + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Sales Trend Line Chart Card */}
        <Card className="lg:col-span-2 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm animate-fade-slide-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/50">
            <div>
              <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Revenue & Orders Trend</CardTitle>
              <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">
                {showForecast ? 'Combined view of historical weekly sales and 4-week linear regression predictions.' : 'Visualization of processed revenue and volume over the last 7 months.'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {forecast && (
                <button
                  onClick={() => setShowForecast(!showForecast)}
                  className={`px-3 py-1 rounded-xl text-2xs font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                    showForecast 
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-850 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  {showForecast ? 'Hide Forecast' : 'AI Sales Forecast'}
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

        {/* Recent Activity Timeline Card */}
        <Card id="tour-stats-activity" className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col animate-fade-slide-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50">
            <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Recent Activity</CardTitle>
            <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Live audit log of ERP events across all modules.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto max-h-[340px] scrollbar-thin">
            {data.activities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                <Clock className="h-8 w-8 text-neutral-300 mb-2" />
                <span className="text-xs text-neutral-400">No activities recorded yet</span>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-100 dark:bg-neutral-800" />
                <div className="space-y-0">
                  {data.activities.map((activity, idx) => {
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
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black text-neutral-700 dark:text-neutral-300 shadow-sm ${cfg.color}`}>
                          {activity.avatar}
                          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-neutral-900 ${cfg.dot}`} />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${cfg.badge}`}>{cfg.label}</span>
                            <span className="text-[10px] font-semibold text-neutral-400 shrink-0">{activity.time}</span>
                          </div>
                          <p className="mt-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed">{activity.message}</p>
                          {activity.amount && (
                            <span className={`mt-0.5 inline-block text-xs font-extrabold ${
                              String(activity.amount).startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-800 dark:text-neutral-200'
                            }`}>{activity.amount}</span>
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

      </div>

      {/* AI Sales Forecast Card */}
      {forecast && (
        <Card className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/20 dark:from-neutral-900 dark:to-neutral-900/50 shadow-sm p-6 mt-6 animate-fade-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/30 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                AI Sales Forecasting Active
              </div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight">AI 30-Day Sales Forecast</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-semibold">
                Using a <b>Simple Linear Regression model</b> trained on historical sales from the last 90 days, we've forecasted your next 30 days of sales revenue.
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
                  forecast.trendDirection === 'up' ? 'text-emerald-600' : forecast.trendDirection === 'down' ? 'text-rose-600' : 'text-neutral-500'
                }`}>
                  {forecast.trendDirection === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {forecast.trendDirection === 'up' ? 'GROWTH' : 'DECLINE'} ({forecast.weeklyGrowthRate})
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}
