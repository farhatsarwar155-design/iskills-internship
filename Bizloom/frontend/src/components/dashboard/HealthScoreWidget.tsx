import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp, TrendingDown, Info, Minus } from 'lucide-react';
import api from '@/lib/api';

interface HealthFactor {
  name: string;
  value: number;
  raw: string;
  impact: 'positive' | 'negative' | 'neutral';
}

interface HealthData {
  score: number;
  factors: HealthFactor[];
  summary: string;
}

export default function HealthScoreWidget() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get('/dashboard/health');
        setData(response.data);
      } catch (err) {
        console.error('Failed to load health score', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm animate-pulse">
        <CardContent className="p-6 h-64 flex items-center justify-center">
          <div className="text-xs text-neutral-400">Analyzing business health...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const getScoreColor = (score: number) => {
    if (score >= 71) return '#10b981'; // emerald-500
    if (score >= 41) return '#f59e0b'; // amber-500
    return '#ef4444'; // rose-500
  };

  const getScoreLabel = (score: number) => {
    if (score >= 71) return 'Healthy';
    if (score >= 41) return 'Fair';
    return 'Critical';
  };

  const color = getScoreColor(data.score);

  return (
    <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col h-full animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            AI Business Health Score
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">
            Real-time assessment of operational efficiency.
          </CardDescription>
        </div>
        <div className="group relative cursor-help">
          <Info className="h-4 w-4 text-neutral-400 hover:text-indigo-500 transition-colors" />
          <div className="absolute right-0 top-6 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-10 text-xs text-neutral-600 dark:text-neutral-400">
            <strong>How is this calculated?</strong>
            <p className="mt-1">
              A weighted composite score based on:
              <br/>- Inventory Turnover (20%)
              <br/>- Sales Growth Trend (30%)
              <br/>- Cash Flow Ratio (30%)
              <br/>- Payment Collection Efficiency (20%)
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
          
          {/* Gauge SVG */}
          <div className="relative w-32 h-20 shrink-0">
            <svg viewBox="0 0 36 18" className="w-full h-full drop-shadow-sm">
              <path
                d="M 2 18 A 16 16 0 0 1 34 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-neutral-100 dark:text-neutral-800"
              />
              <path
                d="M 2 18 A 16 16 0 0 1 34 18"
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="50.2"
                strokeDashoffset={50.2 - (50.2 * data.score) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0 text-center flex flex-col items-center">
              <span className="text-2xl font-black tracking-tighter" style={{ color }}>{data.score}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">{getScoreLabel(data.score)}</span>
            </div>
          </div>

          {/* AI Explanation */}
          <div className="flex-1 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
              {data.summary}
            </p>
          </div>
        </div>

        {/* Factors Breakdown */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          {data.factors.map(factor => {
            const isPos = factor.impact === 'positive';
            const isNeg = factor.impact === 'negative';
            const Icon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
            const colorClass = isPos ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : isNeg ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' : 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800';

            return (
              <div key={factor.name} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/50">
                <div className={`p-1.5 rounded-md ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">{factor.name}</div>
                  <div className="text-xs font-black text-neutral-800 dark:text-neutral-200">{factor.raw}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
