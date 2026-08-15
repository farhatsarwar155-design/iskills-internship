'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { HelpCircle, BookOpen, MessageSquare, ShieldCheck, ChevronDown, ChevronUp, Mail, ExternalLink } from 'lucide-react';

const FAQS = [
  {
    q: 'How does Role-Based Access Control (RBAC) work in Bizloom ERP?',
    a: 'Bizloom enforces 4 discrete roles: Admin (full access), Manager (all modules except finance/payroll edit), Employee (inventory view + sales create), and Accountant (finance & reporting only). Access is validated both client-side and via backend Express middleware.'
  },
  {
    q: 'How is the AI Business Health Score calculated?',
    a: 'The 0-100 score is computed using a weighted composite formula: Inventory Turnover (20%), Sales Growth Trend (30%), Cash Flow Ratio (30%), and Payment Collection Efficiency (20%). The score & metrics are summarized via Claude API.'
  },
  {
    q: 'How does the Predictive Reorder Recommendation system work?',
    a: 'The system analyzes rolling 14-day sales velocity to calculate average daily sales, projects stockout dates, and computes suggested reorder quantities using minimum stock thresholds.'
  },
  {
    q: 'Where are System Audit Logs stored?',
    a: 'Every sensitive operation (logins, failed attempts, record creation, unauthorized access attempts) is recorded in the SystemLog table with timestamps, user identity, module, IP address, and severity.'
  }
];

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              Help & Support Documentation
            </h1>
            <span className="flex h-6 items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider">
              <HelpCircle className="h-3 w-3" />
              User Guide
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-semibold">
            System documentation, frequently asked questions, and support contact details.
          </p>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 p-5 space-y-2 shadow-xs">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 w-fit">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">API Documentation</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Full Swagger/OpenAPI documentation served live on port 5000.
          </p>
          <a
            href="http://localhost:5000/api-docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 pt-1"
          >
            Open Swagger UI <ExternalLink className="h-3 w-3" />
          </a>
        </Card>

        <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 p-5 space-y-2 shadow-xs">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 w-fit">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Audit & Security</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Review live system logs, login attempts, and access control warnings.
          </p>
          <a href="/dashboard/logs" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1">
            View Audit Logs <ExternalLink className="h-3 w-3" />
          </a>
        </Card>

        <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 p-5 space-y-2 shadow-xs">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 w-fit">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Technical Support</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Contact the engineering team or repository maintainers.
          </p>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 pt-1 block">support@bizloom.com</span>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm">
        <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50">
          <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-indigo-500" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Core architecture & usage guides.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div key={idx} className="border border-neutral-100 dark:border-neutral-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-neutral-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="p-3.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
