'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartDataPoint {
  month: string;
  sales: number;
  orders: number;
}

interface SalesChartProps {
  data: ChartDataPoint[];
}

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="w-full h-80 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-40" />
          <XAxis
            dataKey="month"
            stroke="#888888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#888888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
            dx={-10}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-3 shadow-lg backdrop-blur-sm">
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">{payload[0].payload.month}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-neutral-500 dark:text-neutral-400 font-medium">Sales:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">${payload[0].value?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-neutral-500 dark:text-neutral-400 font-medium">Orders:</span>
                        <span className="text-emerald-500 font-bold">{payload[1].value}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            content={({ payload }) => {
              return (
                <div className="flex justify-end gap-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {payload?.map((entry: any, index: number) => (
                    <div key={`item-${index}`} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span>{entry.value === 'sales' ? 'Monthly Sales ($)' : 'Monthly Orders'}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#4f46e5" // indigo-600
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: 'var(--background)' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#10b981" // emerald-500
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 1.5, fill: 'var(--background)' }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
