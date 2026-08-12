'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TrendingUp,
  FileDown,
  Sparkles,
  AlertCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Dynamic import of PDF generator libraries (client-side only)
let html2canvas: any = null;
let jsPDF: any = null;

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [days, setDays] = useState<number>(30);
  const [customRange, setCustomRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [aiSummary, setAISummary] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  // Load PDF export libraries on client-side
  useEffect(() => {
    import('html2canvas-pro').then((m) => { html2canvas = m.default; });
    import('jspdf').then((m) => { jsPDF = m.default; });
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/overview', { params: { days } });
      setAnalyticsData(response.data);
      
      // Proactively fetch AI narrative summary
      fetchAISummary();
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAISummary = async () => {
    setLoadingAI(true);
    try {
      const response = await api.get('/analytics/ai-summary', { params: { days } });
      setAISummary(response.data.summary);
    } catch (err) {
      console.error(err);
      setAISummary('Summary temporarily unavailable. Check backend connection.');
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (!customRange) {
      fetchAnalytics();
    }
  }, [days, customRange]);

  const handleCustomSearch = () => {
    if (!startDate || !endDate) {
      toast.error('Please specify both start and end dates');
      return;
    }
    // Calculate days between start and end
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    setDays(diffDays);
    fetchAnalytics();
  };

  // Recharts color palette
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  const handleExportPDF = async () => {
    if (!html2canvas || !jsPDF) {
      toast.error('Export libraries are still loading. Please try again.');
      return;
    }
    if (!reportRef.current) return;

    setExporting(true);
    const loadingToast = toast.loading('Generating PDF report...');

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 295; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Bizloom_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Report PDF exported successfully!', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF', { id: loadingToast });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-60 bg-neutral-200 dark:bg-neutral-800 rounded" />
        <div className="h-28 w-full bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          <div className="h-80 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-neutral-900 border rounded-2xl text-center">
        <AlertCircle className="h-8 w-8 text-neutral-400 mb-2" />
        <h3 className="text-lg font-bold text-neutral-800 dark:text-white font-black">No Data Loaded</h3>
        <p className="text-xs text-neutral-500 max-w-xs mt-1">Connect the backend database or retry synchronizing analytics data.</p>
        <Button onClick={fetchAnalytics} className="mt-4 h-9 px-4 rounded-xl bg-indigo-600 text-white flex items-center gap-1.5"><RefreshCw className="h-4 w-4" /> Retry</Button>
      </div>
    );
  }

  const { charts, summary } = analyticsData;

  return (
    <div className="space-y-6 pb-12">
      {/* Global staggered slide-up animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .shimmer-bg {
          background: linear-gradient(90deg, var(--color-indigo-50/10) 25%, var(--color-purple-50/10) 50%, var(--color-indigo-50/10) 75%);
          background-size: 200% 100%;
          animation: shimmer 4s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}} />

      {/* Date Filters & Export */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-slide-up" style={{ animationDelay: '0s' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Analytics & Reports</h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400">View real-time business performance summaries, category metrics, and operational audits.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl bg-slate-100/80 dark:bg-neutral-850 p-1 border border-neutral-200/50 dark:border-neutral-800">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => { setDays(d); setCustomRange(false); }}
                className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold cursor-pointer transition-all ${
                  days === d && !customRange
                    ? 'bg-white dark:bg-neutral-900 text-indigo-650 dark:text-indigo-400 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Last {d} Days
              </button>
            ))}
            <button
              onClick={() => setCustomRange(true)}
              className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold cursor-pointer transition-all ${
                customRange
                  ? 'bg-white dark:bg-neutral-900 text-indigo-650 dark:text-indigo-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Custom Range
            </button>
          </div>

          <Button
            onClick={handleExportPDF}
            disabled={exporting}
            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-sm"
          >
            <FileDown className="h-4.5 w-4.5" />
            {exporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>
      </div>

      {/* Custom Range picker inputs */}
      {customRange && (
        <Card className="p-4 border-indigo-100 dark:border-indigo-900/20 bg-indigo-50/5 dark:bg-neutral-900/20 animate-fade-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex flex-wrap items-end gap-4 text-2xs font-bold text-neutral-500">
            <div className="space-y-1">
              <span>Start Date</span>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9.5 rounded-lg border-neutral-250 bg-white" />
            </div>
            <div className="space-y-1">
              <span>End Date</span>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9.5 rounded-lg border-neutral-250 bg-white" />
            </div>
            <Button onClick={handleCustomSearch} className="h-9.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5">Apply Range</Button>
          </div>
        </Card>
      )}

      {/* Combined Printable Area (Includes AI Summary and Charts) */}
      <div ref={reportRef} className="space-y-6 bg-transparent p-1">
        
        {/* Executive AI Narrative Summary Banner */}
        <Card className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/20 dark:from-neutral-900 dark:to-neutral-900/60 shadow-sm p-6 overflow-hidden relative shimmer-bg animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles className="h-32 w-32 text-indigo-600" />
          </div>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/30 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Generated Performance Narrative
            </div>
            <p className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 leading-relaxed font-semibold max-w-4xl">
              {loadingAI ? (
                <span className="flex items-center gap-2 text-neutral-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating monthly executive analysis narrative...
                </span>
              ) : aiSummary}
            </p>
          </div>
        </Card>

        {/* 3 Overview Quick-Stat Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
          <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 p-5 shadow-xs">
            <CardHeader className="p-0 pb-1.5 flex flex-row items-center justify-between">
              <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">Total Period Revenue</span>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">${summary.totalRevenue.toLocaleString()}</h3>
            <span className="text-[10px] font-medium text-neutral-400 block mt-1">Processed orders sum</span>
          </Card>

          <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 p-5 shadow-xs">
            <CardHeader className="p-0 pb-1.5 flex flex-row items-center justify-between">
              <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">Order Volume</span>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">{summary.totalOrders} invoices</h3>
            <span className="text-[10px] font-medium text-neutral-400 block mt-1">Avg Ticket: ${summary.avgOrderValue.toFixed(2)}</span>
          </Card>

          <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 p-5 shadow-xs">
            <CardHeader className="p-0 pb-1.5 flex flex-row items-center justify-between">
              <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">Top Selling Category</span>
              <Layers className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight truncate">{summary.topCategory}</h3>
            <span className="text-[10px] font-medium text-neutral-400 block mt-1">Highest gross category</span>
          </Card>
        </div>

        {/* Charts Grid Layout */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Sales Trend Line Chart */}
          <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm animate-fade-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-850">
              <CardTitle className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5"><TrendingUp className="h-4.5 w-4.5 text-indigo-500" /> Sales Trend</CardTitle>
              <CardDescription className="text-2xs text-neutral-400">Daily sales aggregates over the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-30" />
                  <XAxis dataKey="label" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Category (Pie Chart) */}
          <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm animate-fade-slide-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-850">
              <CardTitle className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5"><PieChart className="h-4.5 w-4.5 text-amber-500" /> Revenue by Category</CardTitle>
              <CardDescription className="text-2xs text-neutral-400">Revenue split breakdown across category listings.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 h-64 flex items-center justify-center">
              {charts.revenueByCategory.length === 0 ? (
                <span className="text-xs text-neutral-400">No category revenue logs found.</span>
              ) : (
                <div className="w-full h-full flex flex-col sm:flex-row items-center justify-around">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={charts.revenueByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {charts.revenueByCategory.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: any) => `$${Number(val).toLocaleString()}`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 text-3xs font-extrabold text-neutral-500">
                    {charts.revenueByCategory.slice(0, 4).map((entry: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="truncate max-w-[100px]">{entry.name}</span>
                        <span className="text-neutral-900 dark:text-white">${entry.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 5 Products by Revenue (Horizontal Bar Chart) */}
          <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm animate-fade-slide-up" style={{ animationDelay: '0.5s' }}>
            <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-850">
              <CardTitle className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5"><BarChart3 className="h-4.5 w-4.5 text-emerald-500" /> Top 5 Selling Products</CardTitle>
              <CardDescription className="text-2xs text-neutral-400">Top selling items ranked by processed currency value.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 h-64">
              {charts.topProducts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-neutral-400">No products sold in this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.topProducts} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" className="opacity-30" />
                    <XAxis type="number" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} width={80} />
                    <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Income vs Expenses Bar Chart */}
          <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm animate-fade-slide-up" style={{ animationDelay: '0.6s' }}>
            <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-850">
              <CardTitle className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5"><BarChart3 className="h-4.5 w-4.5 text-indigo-500" /> Income vs Expenses</CardTitle>
              <CardDescription className="text-2xs text-neutral-400">Comparison of credits vs debits from finance ledger.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 h-64">
              {charts.incomeVsExpense.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-neutral-400">No transactions recorded.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.incomeVsExpense} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-30" />
                    <XAxis dataKey="month" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']} />
                    <Legend verticalAlign="top" height={24} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} name="Income" />
                    <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Customer Growth Area Chart */}
          <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm md:col-span-2 animate-fade-slide-up" style={{ animationDelay: '0.7s' }}>
            <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-850">
              <CardTitle className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5"><Users className="h-4.5 w-4.5 text-indigo-500" /> Customer Base Growth</CardTitle>
              <CardDescription className="text-2xs text-neutral-400">Cumulative customer database registrations overview.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 h-64">
              {charts.customerGrowth.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-neutral-400">No customers registered.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.customerGrowth} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="customerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-30" />
                    <XAxis dataKey="month" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(val: any) => [Number(val), 'Total Customers']} />
                    <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#customerGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
