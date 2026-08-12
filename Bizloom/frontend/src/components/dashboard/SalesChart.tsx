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
  month?: string;
  label?: string;
  sales?: number;
  orders?: number;
  actual?: number | null;
  predicted?: number | null;
}

interface SalesChartProps {
  data: ChartDataPoint[];
}

export default function SalesChart({ data }: SalesChartProps) {
  // Determine keys dynamically based on the dataset
  const hasForecast = data.some(d => d.predicted !== undefined && d.predicted !== null);
  const xKey = data[0]?.label !== undefined ? 'label' : 'month';

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
            dataKey={xKey}
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
                const labelVal = payload[0].payload[xKey];
                return (
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-3 shadow-lg backdrop-blur-sm">
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">{labelVal}</p>
                    <div className="space-y-1">
                      {payload.map((item: any, idx: number) => {
                        const name = item.name === 'actual' ? 'Actual Sales' :
                                     item.name === 'predicted' ? 'Predicted Forecast' :
                                     item.name === 'sales' ? 'Sales' : 'Orders';
                        const color = item.color;
                        const val = typeof item.value === 'number' ? `$${item.value.toLocaleString()}` : item.value;
                        return (
                          <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">{name}:</span>
                            <span className="font-bold animate-pulse-subtle" style={{ color }}>{val}</span>
                          </div>
                        );
                      })}
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
                  {payload?.map((entry: any, index: number) => {
                    const label = entry.value === 'actual' ? 'Actual Sales ($)' :
                                  entry.value === 'predicted' ? 'Forecasted Sales ($)' :
                                  entry.value === 'sales' ? 'Monthly Sales ($)' : 'Monthly Orders';
                    return (
                      <div key={`item-${index}`} className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${entry.value === 'predicted' ? 'border border-dashed' : ''}`}
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          
          {hasForecast ? (
            <>
              <Line
                type="monotone"
                dataKey="actual"
                name="actual"
                stroke="#4f46e5" // indigo-600
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: 'var(--background)' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="predicted"
                stroke="#a855f7" // purple-500
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, strokeWidth: 2, fill: 'var(--background)' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="sales"
                name="sales"
                stroke="#4f46e5" // indigo-600
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: 'var(--background)' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                name="orders"
                stroke="#10b981" // emerald-500
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 1.5, fill: 'var(--background)' }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
