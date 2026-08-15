'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DollarSign, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export interface CashFlowMonth {
  month: string;
  income: number;
  expense: number;
}

export interface CashFlowData {
  history: CashFlowMonth[];
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
}

interface CashFlowWidgetProps {
  data?: CashFlowData;
}

export default function CashFlowWidget({ data }: CashFlowWidgetProps) {
  if (!data) return null;

  const isNetPositive = data.netCashFlow >= 0;

  return (
    <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col h-full animate-fade-slide-up" style={{ animationDelay: '0.45s' }}>
      <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            Cash Flow Snapshot
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">
            6-month income vs. expense comparison.
          </CardDescription>
        </div>
        <Link href="/dashboard/finance" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5">
          View Ledger <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Recharts Bar Chart */}
        <div className="h-40 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-30" />
              <XAxis dataKey="month" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-white dark:bg-neutral-900 p-2 shadow-md text-[10px] space-y-1">
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">{payload[0].payload.month}</div>
                        <div className="text-emerald-600 font-bold">Income: ${payload[0].value?.toLocaleString()}</div>
                        <div className="text-rose-500 font-bold">Expense: ${payload[1]?.value?.toLocaleString()}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Numbers */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Total Income</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              ${data.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="bg-rose-50/50 dark:bg-rose-950/20 p-2 rounded-xl border border-rose-100/50 dark:border-rose-900/30">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Total Expense</span>
            <span className="text-xs font-black text-rose-600 dark:text-rose-400">
              ${data.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className={`p-2 rounded-xl border ${
            isNetPositive
              ? 'bg-emerald-100/40 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50'
              : 'bg-rose-100/40 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50'
          }`}>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Net Cash Flow</span>
            <span className={`text-xs font-black flex items-center justify-center gap-0.5 ${
              isNetPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {isNetPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isNetPositive ? '+' : ''}${data.netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
