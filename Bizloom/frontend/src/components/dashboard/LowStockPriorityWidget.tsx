'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle, CheckCircle2, ShoppingCart, ChevronRight, BellRing } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minStockLevel: number;
  urgency: 'Critical' | 'Low' | 'Watch';
  suggestedReorder: number;
}

interface LowStockPriorityWidgetProps {
  items?: LowStockItem[];
}

export default function LowStockPriorityWidget({ items = [] }: LowStockPriorityWidgetProps) {
  const { user } = useAuth();
  
  const urgencyConfig = {
    Critical: { color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50' },
    Low: { color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50' },
    Watch: { color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50' },
  };

  const handleNotifyManager = (itemName: string) => {
    toast.success(`Notification sent to Manager to reorder ${itemName}`);
  };

  return (
    <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col h-full animate-fade-slide-up" style={{ animationDelay: '0.55s' }}>
      <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
            <Package className="h-4 w-4 text-rose-500" />
            Low Stock Priority List
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">
            Items requiring immediate reorder.
          </CardDescription>
        </div>
        <Link href="/dashboard/inventory" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5">
          View Stock <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-center">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
            <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">All stock levels healthy ✅</h4>
            <p className="text-[11px] text-neutral-400">No items are below minimum thresholds.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map(item => {
              const cfg = urgencyConfig[item.urgency] || urgencyConfig.Watch;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{item.name}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${cfg.color}`}>
                        {item.urgency}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      SKU: {item.sku} · Qty: <strong className="text-neutral-700 dark:text-neutral-300">{item.quantity}</strong> (Min: {item.minStockLevel})
                    </p>
                  </div>

                  {user?.role === 'EMPLOYEE' ? (
                    <button
                      onClick={() => handleNotifyManager(item.name)}
                      className="h-7 px-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-500 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                    >
                      <BellRing className="h-3 w-3" /> Notify Manager
                    </button>
                  ) : (
                    <Link
                      href={`/dashboard/purchases?openDrawer=true&product=${encodeURIComponent(item.sku)}&quantity=${item.suggestedReorder}`}
                      className="h-7 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-xs transition-transform active:scale-95"
                    >
                      <ShoppingCart className="h-3 w-3" /> Reorder
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
