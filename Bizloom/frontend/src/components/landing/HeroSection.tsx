'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle2, LayoutDashboard, Package, ShoppingCart, Users, Wallet, BarChart3, UserCheck, TrendingUp, TrendingDown } from 'lucide-react';
import FadeIn from './FadeIn';
import { useAuth } from '@/context/AuthContext';

// ── Static mini SVG bar chart ──────────────────────────────────────────
function MiniBarChart() {
  const bars = [42, 68, 55, 80, 63, 91, 74];
  const max = 91;
  return (
    <svg viewBox="0 0 160 60" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {bars.map((v, i) => {
        const barH = (v / max) * 52;
        const x = i * 23 + 2;
        return (
          <rect key={i} x={x} y={60 - barH} width="16" height={barH} rx="3" fill="url(#barGrad)" />
        );
      })}
    </svg>
  );
}

// ── Static mini area/line chart for cash flow ─────────────────────────
function MiniLineChart() {
  const pts = [
    [0, 45], [26, 30], [52, 38], [78, 20], [104, 28], [130, 10], [156, 18]
  ];
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const areaD = `${lineD} L156,60 L0,60 Z`;
  return (
    <svg viewBox="0 0 160 60" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={lineD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#10b981" />
      ))}
    </svg>
  );
}

// ── The realistic dashboard mockup ────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-neutral-950 overflow-hidden rounded-xl text-[9px]">

      {/* Fake Sidebar */}
      <div className="hidden sm:flex w-[110px] shrink-0 flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
        {/* Logo */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="h-5 w-5 rounded bg-indigo-600 flex items-center justify-center shrink-0">
            <div className="h-3 w-3 rounded-sm bg-white/80" />
          </div>
          <span className="font-black text-[10px] text-neutral-800 dark:text-white">Bizloom</span>
        </div>
        {/* Menu items */}
        <div className="flex-1 px-2 py-2 space-y-0.5">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: Package, label: 'Inventory', active: false },
            { icon: ShoppingCart, label: 'Sales', active: false },
            { icon: Users, label: 'Customers', active: false },
            { icon: UserCheck, label: 'HR', active: false },
            { icon: Wallet, label: 'Finance', active: false },
            { icon: BarChart3, label: 'Analytics', active: false },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${active ? 'bg-indigo-600 text-white' : 'text-neutral-500 dark:text-neutral-400'}`}>
              <Icon className={`h-2.5 w-2.5 shrink-0 ${active ? 'text-white' : ''}`} />
              <span className="font-bold truncate">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fake Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
          <span className="font-black text-neutral-800 dark:text-white text-[10px]">Overview</span>
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 rounded-md bg-slate-100 dark:bg-neutral-800" />
            <div className="h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-900" />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-hidden p-2 space-y-2">

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Total Revenue', value: '$24,580', trend: '+12%', up: true, color: 'text-indigo-500' },
              { label: 'Inventory Value', value: '$89,200', trend: '+4%', up: true, color: 'text-emerald-500' },
              { label: 'Pending Orders', value: '12', trend: '-3', up: false, color: 'text-amber-500' },
              { label: 'Active Staff', value: '28', trend: '+2', up: true, color: 'text-sky-500' },
            ].map(({ label, value, trend, up, color }) => (
              <div key={label} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-2 flex flex-col gap-1">
                <span className="text-neutral-400 dark:text-neutral-500 font-bold leading-none" style={{ fontSize: '7px' }}>{label}</span>
                <span className="font-black text-neutral-900 dark:text-white leading-none text-[11px]">{value}</span>
                <div className={`flex items-center gap-0.5 font-bold ${up ? 'text-emerald-500' : 'text-rose-500'}`} style={{ fontSize: '7px' }}>
                  {up ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                  {trend}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-5 gap-1.5" style={{ height: '75px' }}>
            {/* Bar chart */}
            <div className="col-span-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-2 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-neutral-800 dark:text-white leading-none" style={{ fontSize: '7px' }}>Monthly Sales</span>
                <span className="text-indigo-500 font-bold" style={{ fontSize: '7px' }}>Last 7 months</span>
              </div>
              <div className="flex-1">
                <MiniBarChart />
              </div>
            </div>
            {/* Line chart */}
            <div className="col-span-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-2 flex flex-col">
              <span className="font-black text-neutral-800 dark:text-white leading-none mb-1" style={{ fontSize: '7px' }}>Cash Flow</span>
              <div className="flex-1">
                <MiniLineChart />
              </div>
            </div>
          </div>

          {/* Bottom Row: Table + AI Score */}
          <div className="grid grid-cols-5 gap-1.5" style={{ height: '72px' }}>
            {/* Mini table */}
            <div className="col-span-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-2 overflow-hidden">
              <span className="font-black text-neutral-800 dark:text-white block mb-1 leading-none" style={{ fontSize: '7px' }}>Recent Orders</span>
              <div className="space-y-1">
                {[
                  { order: '#ORD-2026-041', customer: 'Acme Corp', amount: '$1,240', status: 'Paid' },
                  { order: '#ORD-2026-040', customer: 'TechNova', amount: '$880', status: 'Pending' },
                  { order: '#ORD-2026-039', customer: 'Bright Ltd', amount: '$3,100', status: 'Paid' },
                ].map(({ order, customer, amount, status }) => (
                  <div key={order} className="flex items-center justify-between" style={{ fontSize: '7px' }}>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{order}</span>
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium truncate px-1">{customer}</span>
                    <span className="font-black text-neutral-800 dark:text-white">{amount}</span>
                    <span className={`px-1 py-0.5 rounded font-black ${status === 'Paid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'}`}>{status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Health Score */}
            <div className="col-span-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-2 flex flex-col items-center justify-center gap-1">
              <span className="font-black text-neutral-800 dark:text-white leading-none" style={{ fontSize: '7px' }}>AI Health Score</span>
              <div className="relative flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="w-12 h-12">
                  <circle cx="24" cy="24" r="18" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                  <circle
                    cx="24" cy="24" r="18"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="5"
                    strokeDasharray={`${(78 / 100) * 113} 113`}
                    strokeDashoffset="28"
                    strokeLinecap="round"
                    transform="rotate(-90 24 24)"
                  />
                  <text x="24" y="27" textAnchor="middle" className="fill-neutral-900 dark:fill-white" style={{ fontSize: '11px', fontWeight: 900, fill: '#1e293b' }}>78</text>
                </svg>
              </div>
              <span className="font-bold text-emerald-500 leading-none" style={{ fontSize: '7px' }}>● Good — Growing</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-neutral-950 -z-10" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-3xl opacity-70 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-500/10 dark:bg-rose-600/10 rounded-full blur-3xl opacity-70 translate-y-1/3 -translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500">AI-Powered</span> ERP Built for Growing Businesses
          </h1>
        </FadeIn>

        <FadeIn delay={200}>
          <p className="mt-6 text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Unify your inventory, sales, HR, and finances in one intelligent platform. 
            Get predictive insights and automate daily operations effortlessly.
          </p>
        </FadeIn>

        <FadeIn delay={300}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto cursor-pointer">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login?demo=admin">
              <Button variant="outline" className="h-14 px-8 rounded-2xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 text-base font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all w-full sm:w-auto cursor-pointer">
                <Play className="mr-2 h-5 w-5 fill-current opacity-70" /> View Demo
              </Button>
            </Link>
          </div>
        </FadeIn>

        {/* ── Dashboard Mockup Visual ── */}
        <FadeIn delay={500} className="mt-20">
          <div className="relative mx-auto max-w-[1000px]">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent blur-3xl opacity-50 pointer-events-none" />

            {/* Browser chrome frame */}
            <div className="relative rounded-2xl md:rounded-[2rem] border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl shadow-neutral-900/20 overflow-hidden">
              {/* Browser top bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 w-full max-w-xs mx-auto rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">app.bizloom.com/dashboard</span>
                  </div>
                </div>
              </div>

              {/* Dashboard content — fixed height, no scroll */}
              <div style={{ height: '340px' }}>
                <DashboardMockup />
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
