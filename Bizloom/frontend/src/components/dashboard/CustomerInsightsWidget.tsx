'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, UserPlus, Crown, Repeat, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface CustomerInsightsData {
  newCustomers: number;
  customerTrendPct: number;
  topCustomer: {
    name: string;
    totalSpent: number;
  };
  repeatCustomerRate: number;
}

interface CustomerInsightsWidgetProps {
  data?: CustomerInsightsData;
}

export default function CustomerInsightsWidget({ data }: CustomerInsightsWidgetProps) {
  if (!data) return null;

  const isTrendUp = data.customerTrendPct >= 0;

  return (
    <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col h-full animate-fade-slide-up" style={{ animationDelay: '0.5s' }}>
      <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-indigo-500" />
            Customer Insights
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">
            Acquisition & retention highlights.
          </CardDescription>
        </div>
        <Link href="/dashboard/customers" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5">
          View All <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-center">
        {/* Stat 1: New Customers This Month */}
        <div className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">New Customers</span>
              <span className="text-sm font-black text-neutral-900 dark:text-white">{data.newCustomers} this month</span>
            </div>
          </div>
          <span className={`inline-flex items-center gap-0.5 text-xs font-extrabold px-2 py-0.5 rounded-md ${
            isTrendUp
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
              : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
          }`}>
            {isTrendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isTrendUp ? '+' : ''}{data.customerTrendPct}%
          </span>
        </div>

        {/* Stat 2: Top Customer */}
        <div className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 shrink-0">
              <Crown className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Top Account</span>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate block">{data.topCustomer.name}</span>
            </div>
          </div>
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">
            ${data.topCustomer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Stat 3: Repeat Customer Rate */}
        <div className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Repeat Order Rate</span>
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Multiple orders</span>
            </div>
          </div>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            {data.repeatCustomerRate}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
