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
  type: string;
  message: string;
  amount: string | null;
  user: string;
  time: string;
  status: string;
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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSync = () => {
    fetchDashboard(true);
  };

  // Render Stat Card helper
  const renderStatCard = (title: string, value: string, icon: any, stats: DashboardStats, colorClass: string) => {
    const Icon = icon;
    const isUp = stats.trend === 'up';
    const isDown = stats.trend === 'down';

    return (
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 overflow-hidden group">
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

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        {renderStatCard('Total Sales', data.stats.totalSales.value, DollarSign, data.stats.totalSales, 'text-indigo-600 dark:text-indigo-400')}
        {renderStatCard('Inventory Value', data.stats.inventoryValue.value, Package, data.stats.inventoryValue, 'text-amber-500 dark:text-amber-400')}
        {renderStatCard('Pending Orders', data.stats.pendingOrders.value, ShoppingCart, data.stats.pendingOrders, 'text-emerald-500')}
        {renderStatCard('Active Staff', data.stats.activeEmployees.value, Users, data.stats.activeEmployees, 'text-sky-500')}
      </div>

      {/* Main Grid: Recharts + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Sales Trend Line Chart Card */}
        <Card className="lg:col-span-2 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/50">
            <div>
              <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Revenue & Orders Trend</CardTitle>
              <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Visualization of processed revenue and volume over the last 6 months.</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
              <TrendingUp className="h-3 w-3" />
              +14% Growth
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <SalesChart data={data.salesTrend} />
          </CardContent>
        </Card>

        {/* Recent Activity Feed Card */}
        <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50">
            <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Recent Activity</CardTitle>
            <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Log of recent transactions and admin audit actions.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto max-h-[340px] scrollbar-thin space-y-4">
            {data.activities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                <Clock className="h-8 w-8 text-neutral-300 mb-2" />
                <span className="text-xs text-neutral-400">No activities found</span>
              </div>
            ) : (
              data.activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 text-xs relative group">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-neutral-800 border border-neutral-200/40 dark:border-neutral-700/40">
                    <Clock className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 font-bold text-neutral-800 dark:text-neutral-200">
                      <span className="truncate">{activity.user}</span>
                      {activity.amount && (
                        <span className={`shrink-0 font-extrabold ${
                          activity.amount.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-800 dark:text-neutral-200'
                        }`}>
                          {activity.amount}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">{activity.message}</p>
                    <span className="mt-1 block text-[10px] font-semibold text-neutral-400">{activity.time}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
