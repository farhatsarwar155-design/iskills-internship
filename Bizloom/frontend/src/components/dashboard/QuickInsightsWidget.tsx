'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp, AlertTriangle, Calendar, Lightbulb } from 'lucide-react';

export interface InsightItem {
  id: string;
  type: 'growth' | 'warning' | 'peak';
  icon: string;
  title: string;
  description: string;
}

interface QuickInsightsWidgetProps {
  insights?: InsightItem[];
}

export default function QuickInsightsWidget({ insights = [] }: QuickInsightsWidgetProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'growth':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'peak':
        return <Calendar className="h-4 w-4 text-indigo-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-sky-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'growth':
        return 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30';
      case 'warning':
        return 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30';
      case 'peak':
        return 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30';
      default:
        return 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30';
    }
  };

  return (
    <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col h-full animate-fade-slide-up" style={{ animationDelay: '0.5s' }}>
      <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Quick Data Insights
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">
            Automated intelligence & patterns.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-center">
        {insights.length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-400">Analyzing business data...</div>
        ) : (
          insights.map(item => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-start gap-3 transition-all hover:scale-[1.01] ${getBg(item.type)}`}
            >
              <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 shadow-xs shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 tracking-tight">{item.title}</h4>
                <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                  {item.description}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
