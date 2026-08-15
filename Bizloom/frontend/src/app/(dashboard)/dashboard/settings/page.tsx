'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Building, Sliders, Shield, Sun, Moon, Save, UserCheck, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [companyName, setCompanyName] = useState('Bizloom Enterprise Solutions');
  const [currency, setCurrency] = useState('USD ($)');
  const [taxRate, setTaxRate] = useState('10.0');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('NET 30');
  const [salesTarget, setSalesTarget] = useState('50000');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              App Settings
            </h1>
            <span className="flex h-6 items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider">
              <Settings className="h-3 w-3" />
              System Config
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-semibold">
            Configure system-wide parameters, company information, and theme preferences.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Profile */}
        <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm">
          <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50">
            <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
              <Building className="h-4 w-4 text-indigo-500" />
              Company Information
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Appears on sales invoices and purchase orders.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Company Legal Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Default Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 font-semibold"
                >
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                  <option value="PKR (Rs)">PKR (Rs) - Pakistani Rupee</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Defaults */}
        <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm">
          <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50">
            <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-emerald-500" />
              Operational Defaults
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Billing terms & tax defaults.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Default Sales Tax (%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Default Payment Terms</label>
                <select
                  value={defaultPaymentTerms}
                  onChange={e => setDefaultPaymentTerms(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 font-semibold"
                >
                  <option value="DUE ON RECEIPT">Due on Receipt</option>
                  <option value="NET 15">NET 15</option>
                  <option value="NET 30">NET 30</option>
                  <option value="NET 60">NET 60</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Monthly Sales Goal ($)</label>
                <input
                  type="number"
                  value={salesTarget}
                  onChange={e => setSalesTarget(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-semibold"
                  disabled={user?.role !== 'ADMIN'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance & Theme */}
        <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm">
          <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50">
            <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-amber-500" />
              Theme Preference
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">Toggle light or dark interface theme.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                Current Theme: <span className="text-indigo-600 dark:text-indigo-400 capitalize">{theme} Mode</span>
              </span>
              <span className="text-[11px] text-neutral-400">Switch mode instantly across the ERP.</span>
            </div>
            <Button
              type="button"
              onClick={toggleTheme}
              variant="outline"
              className="h-10 px-4 rounded-xl border-neutral-200 dark:border-neutral-800 font-bold text-xs flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
              Toggle Theme
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md">
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
