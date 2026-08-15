'use client';

import React from 'react';
import FadeIn from './FadeIn';
import { CheckCircle2, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, Package } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Shared SVG helpers
// ─────────────────────────────────────────────────────────────────────────────

function MiniAreaChart({ color = '#6366f1' }: { color?: string }) {
  const pts = [[0, 52], [30, 38], [60, 44], [90, 22], [120, 30], [150, 14], [180, 20]];
  const lineD = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaD = `${lineD} L180,62 L0,62 Z`;
  return (
    <svg viewBox="0 0 180 65" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`area-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#area-${color.replace('#', '')})`} />
      <path d={lineD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={color} />
      ))}
    </svg>
  );
}

function MiniBarChart() {
  const bars = [
    { v: 55, color: '#6366f1' },
    { v: 72, color: '#6366f1' },
    { v: 48, color: '#6366f1' },
    { v: 85, color: '#6366f1' },
    { v: 63, color: '#6366f1' },
    { v: 91, color: '#a855f7' },
  ];
  const max = 91;
  return (
    <svg viewBox="0 0 186 60" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="barGradLast" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {bars.map(({ v, color }, i) => {
        const barH = (v / max) * 54;
        const x = i * 32 + 3;
        const grad = color === '#a855f7' ? 'url(#barGradLast)' : 'url(#barGrad2)';
        return <rect key={i} x={x} y={60 - barH} width="22" height={barH} rx="4" fill={grad} />;
      })}
    </svg>
  );
}

function CircleScore({ score = 82 }: { score?: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <svg viewBox="0 0 56 56" className="w-14 h-14">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle
        cx="28" cy="28" r={r}
        fill="none"
        stroke="#6366f1"
        strokeWidth="6"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="33" textAnchor="middle" style={{ fontSize: '13px', fontWeight: 900, fill: '#1e293b' }}>{score}</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mockup 1 — Intelligent Dashboard
// ─────────────────────────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="flex-1 p-3 flex flex-col gap-2.5 bg-slate-50 dark:bg-neutral-950">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-neutral-800 dark:text-white">Overview · Aug 2026</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">● Live</span>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Revenue', value: '$18,240', trend: '+14%', up: true },
          { label: 'Orders', value: '156', trend: '+8', up: true },
          { label: 'Expenses', value: '$9,870', trend: '+2%', up: false },
        ].map(({ label, value, trend, up }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-2 flex flex-col gap-0.5">
            <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500">{label}</span>
            <span className="text-[13px] font-black text-neutral-900 dark:text-white leading-tight">{value}</span>
            <span className={`text-[8px] font-bold flex items-center gap-0.5 ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
              {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}{trend}
            </span>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-2 flex-1 min-h-0">
        <div className="col-span-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-2 flex flex-col">
          <span className="text-[8px] font-black text-neutral-600 dark:text-neutral-400 mb-1">Sales Trend</span>
          <div className="flex-1 min-h-0">
            <MiniAreaChart color="#6366f1" />
          </div>
        </div>
        <div className="col-span-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-2 flex flex-col items-center justify-center gap-1">
          <span className="text-[8px] font-black text-neutral-600 dark:text-neutral-400">AI Health Score</span>
          <CircleScore score={82} />
          <span className="text-[8px] font-bold text-emerald-500">Good · Growing</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mockup 2 — Smart Inventory
// ─────────────────────────────────────────────────────────────────────────────
function InventoryMockup() {
  const products = [
    { name: 'Wireless Keyboard', sku: 'KB-001', qty: 3, status: 'Critical', statusColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' },
    { name: 'USB-C Hub 7-Port', sku: 'HB-022', qty: 11, status: 'Low Stock', statusColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' },
    { name: 'Monitor 27" 4K', sku: 'MN-045', qty: 28, status: 'In Stock', statusColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
    { name: 'Laptop Stand Adj.', sku: 'LS-007', qty: 6, status: 'Low Stock', statusColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' },
  ];
  return (
    <div className="flex-1 p-3 flex flex-col gap-2.5 bg-slate-50 dark:bg-neutral-950">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-neutral-800 dark:text-white">Inventory Control</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 flex items-center gap-1">
          <AlertTriangle className="h-2.5 w-2.5" /> 2 Stockouts Soon
        </span>
      </div>

      {/* Product table */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 overflow-hidden flex-1">
        <div className="grid grid-cols-4 px-2.5 py-1.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          {['Product', 'SKU', 'Qty', 'Status'].map(h => (
            <span key={h} className="text-[8px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{h}</span>
          ))}
        </div>
        {products.map(({ name, sku, qty, status, statusColor }) => (
          <div key={sku} className="grid grid-cols-4 px-2.5 py-2 border-b border-neutral-50 dark:border-neutral-800/50 items-center last:border-0">
            <span className="text-[9px] font-bold text-neutral-800 dark:text-neutral-200 truncate pr-1">{name}</span>
            <span className="text-[8px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{sku}</span>
            <span className="text-[10px] font-black text-neutral-900 dark:text-white">{qty}</span>
            <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded-full ${statusColor} inline-block w-fit`}>{status}</span>
          </div>
        ))}
      </div>

      {/* Reorder suggestion */}
      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-lg px-2.5 py-2 flex items-center justify-between">
        <div>
          <span className="text-[8px] font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
            <Package className="h-2.5 w-2.5" /> AI Reorder Suggestion
          </span>
          <span className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400 block mt-0.5">Order 50× KB-001 from TechSupply Co.</span>
        </div>
        <div className="h-5 px-2 rounded bg-indigo-600 text-white text-[8px] font-black flex items-center">Reorder</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mockup 3 — Comprehensive Reports
// ─────────────────────────────────────────────────────────────────────────────
function ReportsMockup() {
  return (
    <div className="flex-1 p-3 flex flex-col gap-2.5 bg-slate-50 dark:bg-neutral-950">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-neutral-800 dark:text-white">Profit &amp; Loss · Q2 2026</span>
        <div className="h-5 px-2 rounded bg-neutral-800 dark:bg-neutral-700 text-white text-[8px] font-black flex items-center gap-1">
          ↓ Export PDF
        </div>
      </div>

      {/* P&L Summary Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-2.5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Income', value: '$42,000', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
            { label: 'Total Expenses', value: '$28,500', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
            { label: 'Net Profit', value: '$13,500', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-lg p-2 flex flex-col gap-0.5`}>
              <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500">{label}</span>
              <span className={`text-[13px] font-black ${color} leading-tight`}>{value}</span>
              <div className="h-1 rounded-full bg-current opacity-20 mt-0.5" />
            </div>
          ))}
        </div>
        {/* Mini breakdown bars */}
        <div className="mt-2.5 space-y-1.5">
          {[
            { label: 'Product Sales', pct: 78, color: 'bg-indigo-500' },
            { label: 'Service Revenue', pct: 52, color: 'bg-emerald-500' },
            { label: 'Operational Costs', pct: 64, color: 'bg-rose-400' },
          ].map(({ label, pct, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400 w-24 shrink-0">{label}</span>
              <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[8px] font-black text-neutral-700 dark:text-neutral-300 w-7 text-right">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-2 flex-1 flex flex-col min-h-0">
        <span className="text-[8px] font-black text-neutral-600 dark:text-neutral-400 mb-1">6-Month Revenue vs Expenses</span>
        <div className="flex-1 min-h-0">
          <MiniBarChart />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module wrapper — browser frame + content
// ─────────────────────────────────────────────────────────────────────────────
function ModuleMockupFrame({ children, gradient }: { children: React.ReactNode; gradient: string }) {
  return (
    <div className="flex-1 w-full">
      <FadeIn delay={200} className="relative">
        <div className={`absolute inset-0 bg-gradient-to-tr ${gradient} blur-3xl opacity-40 rounded-[40%]`} />
        <div className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
          {/* Browser chrome dots */}
          <div className="h-9 border-b border-neutral-100 dark:border-neutral-800 flex items-center px-3 gap-1.5 bg-neutral-50 dark:bg-neutral-950 shrink-0">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          {/* Content fills remaining space */}
          <div className="flex flex-col" style={{ height: 'calc(100% - 36px)' }}>
            {children}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module data
// ─────────────────────────────────────────────────────────────────────────────
const modules = [
  {
    title: 'Intelligent Dashboard',
    subtitle: 'Your business at a glance',
    description: 'Get a real-time overview of your company\'s performance. Track key metrics, view upcoming tasks, and monitor system health from a single, customizable interface.',
    bullets: [
      'Real-time cash flow and sales trends',
      'AI-powered Business Health Score',
      'Actionable insights and priority tasks',
    ],
    gradient: 'from-indigo-500/20 to-rose-500/20',
    reversed: false,
    mockup: <DashboardMockup />,
  },
  {
    title: 'Smart Inventory',
    subtitle: 'Never run out of stock',
    description: 'Manage thousands of SKUs effortlessly. Our AI predicts when you\'ll run out of stock and automatically suggests reorder quantities before it impacts your sales.',
    bullets: [
      'Predictive stockout alerts',
      'Multi-warehouse tracking',
      'One-click purchase orders',
    ],
    gradient: 'from-emerald-500/20 to-sky-500/20',
    reversed: true,
    mockup: <InventoryMockup />,
  },
  {
    title: 'Comprehensive Reports',
    subtitle: 'Data-driven decisions',
    description: 'Generate detailed financial statements, sales reports, and HR analytics. Export to PDF or CSV instantly and keep your accountants happy.',
    bullets: [
      'Automated Profit & Loss statements',
      'Employee attendance & payroll logs',
      'Custom date range filtering',
    ],
    gradient: 'from-amber-500/20 to-rose-500/20',
    reversed: false,
    mockup: <ReportsMockup />,
  },
];

export default function ModulesShowcase() {
  return (
    <section id="modules" className="py-24 bg-slate-50 dark:bg-neutral-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
        {modules.map((mod, idx) => (
          <div
            key={idx}
            className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${mod.reversed ? 'lg:flex-row-reverse' : ''}`}
          >
            {/* Text Side */}
            <div className="flex-1 space-y-6">
              <FadeIn>
                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {mod.subtitle}
                </h4>
                <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
                  {mod.title}
                </h2>
                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                  {mod.description}
                </p>
                <ul className="mt-8 space-y-4">
                  {mod.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300 font-bold">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>

            {/* Mockup Side */}
            <ModuleMockupFrame gradient={mod.gradient}>
              {mod.mockup}
            </ModuleMockupFrame>
          </div>
        ))}
      </div>
    </section>
  );
}
