'use client';

import React from 'react';
import FadeIn from './FadeIn';
import { Package, ShoppingCart, Activity, Users, Truck, Wallet, TrendingUp, ShieldCheck } from 'lucide-react';

const features = [
  {
    title: 'Inventory Management',
    description: 'Real-time stock tracking with predictive reorder alerts.',
    icon: Package,
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
  },
  {
    title: 'Sales & Invoicing',
    description: 'Create invoices and track payments effortlessly.',
    icon: ShoppingCart,
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10'
  },
  {
    title: 'AI Business Health',
    description: 'Get an instant health check of your entire business.',
    icon: Activity,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
  },
  {
    title: 'HR & Attendance',
    description: 'Manage your team and payroll in one central place.',
    icon: Users,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
  },
  {
    title: 'Purchase Orders',
    description: 'Streamline supplier relationships and procurement.',
    icon: Truck,
    color: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10'
  },
  {
    title: 'Finance & Analytics',
    description: 'Track cash flow and profitability with clear reports.',
    icon: Wallet,
    color: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10'
  },
  {
    title: 'AI Sales Forecasting',
    description: 'Predict next month\'s demand with machine learning.',
    icon: TrendingUp,
    color: 'text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-500/10'
  },
  {
    title: 'Role-Based Security',
    description: 'Enterprise-grade access control for every team member.',
    icon: ShieldCheck,
    color: 'text-slate-500 bg-slate-100 dark:bg-slate-500/10'
  }
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
              Everything you need to run your business
            </h2>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">
              Bizloom consolidates all the tools you use into one, unified platform. 
              Say goodbye to fragmented software and manual data entry.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <FadeIn key={idx} delay={idx * 50} className="h-full">
              <div className="group h-full p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 hover:bg-white dark:hover:bg-neutral-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
