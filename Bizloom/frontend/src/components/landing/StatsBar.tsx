'use client';

import React from 'react';
import FadeIn from './FadeIn';

const stats = [
  { label: 'Active Businesses', value: '500+' },
  { label: 'Uptime Reliability', value: '99.9%' },
  { label: 'AI Assistance', value: '24/7' },
  { label: 'Customer Satisfaction', value: '4.9/5' },
];

export default function StatsBar() {
  return (
    <div className="border-y border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center divide-x-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
          {stats.map((stat, i) => (
            <FadeIn key={i} delay={i * 100} className="flex flex-col items-center justify-center space-y-1">
              <span className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white">
                {stat.value}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                {stat.label}
              </span>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
}
