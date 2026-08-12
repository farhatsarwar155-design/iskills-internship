'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { toast } from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Search,
  Filter,
  Plus,
  Trash2,
  AlertTriangle,
  FolderOpen,
  Calendar,
  DollarSign,
  FileDown,
  ChevronDown
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string | null;
  date: string;
}

interface LedgerGroup {
  month: string;
  income: number;
  expense: number;
  transactions: Transaction[];
}

interface SummaryInfo {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export default function FinancePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Data lists
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledger, setLedger] = useState<LedgerGroup[]>([]);
  const [summary, setSummary] = useState<SummaryInfo>({ totalIncome: 0, totalExpenses: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);

  // Tabs: Transactions vs Monthly Ledger
  const [viewTab, setViewTab] = useState<'transactions' | 'ledger'>('transactions');

  // Filters & Pagination
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Add Transaction Form
  const [formData, setFormData] = useState({
    type: 'INCOME',
    category: 'Sales Revenue',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Static list of categories for forms and filters
  const incomeCategories = ['Sales Revenue', 'Consulting', 'Investment', 'Refunds', 'Other Income'];
  const expenseCategories = ['Cost of Goods Sold', 'Rent', 'Utilities', 'Payroll', 'Software Subscriptions', 'Marketing', 'Travel', 'Office Supplies', 'Taxes', 'Other Expense'];

  const fetchSummary = async () => {
    try {
      const res = await api.get('/finance/summary');
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Failed to load summary info', err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance/transactions', {
        params: {
          type: typeFilter,
          category: categoryFilter,
          startDate,
          endDate,
          page,
          limit: 10
        }
      });
      setTransactions(res.data.transactions);
      setTotalPages(res.data.pagination.totalPages);
      setTotalCount(res.data.pagination.total);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await api.get('/finance/ledger');
      setLedger(res.data.ledger);
    } catch (err) {
      console.error('Failed to load ledger groups', err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, startDate, endDate, page]);

  useEffect(() => {
    if (viewTab === 'ledger') {
      fetchLedger();
    }
  }, [viewTab]);

  // Open add modal when ?openDrawer=true is present in the URL
  useEffect(() => {
    if (searchParams.get('openDrawer') === 'true') {
      setIsAddOpen(true);
    }
  }, [searchParams]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.category,
      t.amount.toFixed(2),
      t.description || ''
    ]);
    exportToCSV(headers, rows, `finance_transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount'];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.category,
      `$${t.amount.toFixed(2)}`
    ]);
    exportToPDF('Finance Transactions', headers, rows, `finance_transactions_export_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.category) errors.category = 'Please select a category';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid positive transaction amount';
    }
    if (!formData.date) errors.date = 'Transaction date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      // Auto-set default category when changing type
      if (name === 'type') {
        next.category = value === 'INCOME' ? 'Sales Revenue' : 'Cost of Goods Sold';
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await api.post('/finance/transactions', formData);
      toast.success('Transaction logged successfully!');
      setIsAddOpen(false);
      
      // Reset form
      setFormData({
        type: 'INCOME',
        category: 'Sales Revenue',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });

      // Reload
      fetchSummary();
      fetchTransactions();
      if (viewTab === 'ledger') fetchLedger();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/finance/transactions/${id}`);
      toast.success('Transaction record deleted');
      setIsDeleteConfirmOpen(null);
      fetchSummary();
      fetchTransactions();
      if (viewTab === 'ledger') fetchLedger();
    } catch (err) {
      toast.error('Failed to delete transaction');
    }
  };

  return (
    <div className="space-y-6 relative min-h-screen pb-16">
      {/* 1. Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Accounting & Finance</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Track company invoices, purchases, operational ledger entries, and Profit & Loss reports.</p>
        </div>
        <div className="relative flex-shrink-0">
          <Button variant="outline" onClick={() => setExportMenuOpen(prev => !prev)} className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-2 hover:bg-slate-50">
            <FileDown className="h-4.5 w-4.5" />
            Export
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          {exportMenuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-20 overflow-hidden">
              <button onClick={() => { handleExportCSV(); setExportMenuOpen(false); }} className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
                📄 Export as CSV
              </button>
              <button onClick={() => { handleExportPDF(); setExportMenuOpen(false); }} className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
                📋 Export as PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Profit & Loss summaries cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border border-emerald-100 dark:border-emerald-950 bg-white dark:bg-neutral-900 shadow-sm p-5 relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">Total Income</span>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">${summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-rose-100 dark:border-rose-950 bg-white dark:bg-neutral-900 shadow-sm p-5 relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">Total Expenses</span>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">${summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className={`rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm p-5 relative overflow-hidden group ${
          summary.netProfit >= 0 ? 'border-indigo-100 dark:border-indigo-950' : 'border-rose-100 dark:border-rose-950'
        }`}>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">Net Profit</span>
              <h3 className={`text-xl font-black ${summary.netProfit >= 0 ? 'text-indigo-650 dark:text-indigo-400' : 'text-rose-650'}`}>
                ${summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              summary.netProfit >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
            }`}>
              <Coins className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* View Switch Tab */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 flex gap-6 text-xs font-bold text-neutral-400 dark:text-neutral-500">
        <button
          onClick={() => setViewTab('transactions')}
          className={`pb-3 flex items-center gap-1.5 transition-all ${viewTab === 'transactions' ? 'border-b-2 border-indigo-650 text-indigo-650 dark:text-indigo-400' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
        >
          <Coins className="h-4 w-4" /> Transactions
        </button>
        <button
          onClick={() => setViewTab('ledger')}
          className={`pb-3 flex items-center gap-1.5 transition-all ${viewTab === 'ledger' ? 'border-b-2 border-indigo-650 text-indigo-650 dark:text-indigo-400' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
        >
          <FolderOpen className="h-4 w-4" /> Monthly Ledger
        </button>
      </div>

      {/* Tab Panes */}
      <div className="space-y-6">
        {viewTab === 'transactions' && (
          <>
            {/* Filter Bar */}
            <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end text-2xs font-bold text-neutral-500 dark:text-neutral-400">
                <div className="space-y-1.5">
                  <span className="uppercase tracking-wider">Type</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setCategoryFilter('all'); setPage(1); }}
                    className="w-full h-10 rounded-xl border border-neutral-250 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <span className="uppercase tracking-wider">Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="w-full h-10 rounded-xl border border-neutral-250 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    {typeFilter !== 'EXPENSE' && incomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    {typeFilter !== 'INCOME' && expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <span className="uppercase tracking-wider">Start Date</span>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    className="h-10 rounded-xl border-neutral-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="uppercase tracking-wider">End Date</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    className="h-10 rounded-xl border-neutral-200"
                  />
                </div>
              </div>
            </Card>

            {/* Transactions Table */}
            <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900/30 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-bold">
                      <th className="p-4">Date</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 text-right">Amount</th>
                      {['ADMIN', 'ACCOUNTANT'].includes(user?.role || '') && <th className="p-4 text-center">Actions</th>}
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    {loading ? (
                      [...Array(6)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-4"><div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800" /></td>
                          <td className="p-4"><div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800" /></td>
                          <td className="p-4"><div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-800" /></td>
                          <td className="p-4"><div className="h-5 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                          <td className="p-4"><div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 ml-auto" /></td>
                          {['ADMIN', 'ACCOUNTANT'].includes(user?.role || '') && <td className="p-4"><div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" /></td>}
                        </tr>
                      ))
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-16 text-center text-neutral-400">
                          <div className="flex flex-col items-center justify-center">
                            <FolderOpen className="h-8 w-8 mb-2 opacity-50" />
                            <p className="font-bold">No transactions found</p>
                            <p className="text-3xs text-neutral-500 mt-1">Adjust filters or log a new transaction record.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      transactions.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/25 transition-colors">
                          <td className="p-4 font-semibold text-neutral-500">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="p-4 font-bold text-neutral-800 dark:text-neutral-200">{item.category}</td>
                          <td className="p-4 text-neutral-500 font-semibold line-clamp-1 py-5">{item.description || '—'}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              item.type === 'INCOME'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-705 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-450'
                            }`}>
                              {item.type === 'INCOME' ? 'Income' : 'Expense'}
                            </span>
                          </td>
                          <td className={`p-4 text-right font-black text-xs ${
                            item.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-405' : 'text-rose-600 dark:text-rose-405'
                          }`}>
                            {item.type === 'INCOME' ? '+' : '-'}${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          {['ADMIN', 'ACCOUNTANT'].includes(user?.role || '') && (
                            <td className="p-4 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsDeleteConfirmOpen(item.id)}
                                className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg"
                                title="Delete Transaction"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/50 p-4 bg-slate-50/30 dark:bg-neutral-900/10">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Showing page <span className="font-bold text-neutral-900 dark:text-white">{page}</span> of{' '}
                    <span className="font-bold text-neutral-900 dark:text-white">{totalPages}</span> ({totalCount} total entries)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="h-8 rounded-lg px-3 text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={page === totalPages}
                      className="h-8 rounded-lg px-3 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {viewTab === 'ledger' && (
          <div className="space-y-6">
            {ledger.length === 0 ? (
              <Card className="p-16 text-center text-neutral-400">No monthly ledger groups found.</Card>
            ) : (
              ledger.map((group, gIdx) => (
                <Card key={gIdx} className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                  {/* Ledger Header */}
                  <div className="p-4 bg-slate-50/50 dark:bg-neutral-900/30 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="font-black text-sm text-neutral-850 dark:text-white">{group.month} Ledger</h3>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="h-4.5 w-4.5" />
                        <span>+${group.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-rose-600">
                        <TrendingDown className="h-4.5 w-4.5" />
                        <span>-${group.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded-lg border ${
                        group.income - group.expense >= 0 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/20' 
                          : 'bg-rose-50 border-rose-200 text-rose-650'
                      }`}>
                        Net: ${(group.income - group.expense).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Ledger Group Transactions */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
                        {group.transactions.map(item => (
                          <tr key={item.id}>
                            <td className="p-4 w-28 text-neutral-500 font-semibold">{new Date(item.date).toLocaleDateString()}</td>
                            <td className="p-4 w-40 font-bold text-neutral-800 dark:text-neutral-200">{item.category}</td>
                            <td className="p-4 text-neutral-500 font-semibold">{item.description || '—'}</td>
                            <td className="p-4 w-24">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                                item.type === 'INCOME'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400'
                                  : 'bg-rose-50 text-rose-705 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-450'
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className={`p-4 text-right w-36 font-black ${
                              item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {item.type === 'INCOME' ? '+' : '-'}${item.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) for adding Transaction */}
      {['ADMIN', 'ACCOUNTANT'].includes(user?.role || '') && (
        <div className="fixed bottom-6 right-24 z-40 print-hide">
          <Button
            onClick={() => setIsAddOpen(true)}
            className="h-13 w-13 rounded-full bg-indigo-600 hover:bg-indigo-505 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center p-0 transition-all border border-indigo-200/20"
            title="Log Transaction"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Add Transaction Dialog Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-neutral-900 dark:text-white">Quick Log Transaction</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">Record a new credit or debit entry in the general ledger.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-700 dark:text-neutral-300">Transaction Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-850 dark:bg-neutral-950 dark:text-neutral-300"
                >
                  <option value="INCOME">Income (Credit)</option>
                  <option value="EXPENSE">Expense (Debit)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-700 dark:text-neutral-300">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-705 dark:border-neutral-855 dark:bg-neutral-950 dark:text-neutral-300"
                >
                  {formData.type === 'INCOME' 
                    ? incomeCategories.map(c => <option key={c} value={c}>{c}</option>)
                    : expenseCategories.map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-700 dark:text-neutral-300">Amount ($) *</label>
                <Input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={`h-10 rounded-xl border-neutral-250 ${formErrors.amount ? 'border-rose-500' : ''}`}
                  placeholder="0.00"
                />
                {formErrors.amount && <p className="text-rose-500 text-2xs font-bold">{formErrors.amount}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-700 dark:text-neutral-300">Date *</label>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="h-10 rounded-xl border-neutral-250"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-700 dark:text-neutral-300">Description / Memo</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                placeholder="Log transaction details..."
                className="w-full text-xs font-semibold rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <DialogFooter className="pt-4 flex flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="flex-1 h-10 rounded-xl text-neutral-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                {submitting ? 'Logging...' : 'Log Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen !== null} onOpenChange={(open) => !open && setIsDeleteConfirmOpen(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-850 shadow-xl">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-600 mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-base font-bold">Delete Transaction Entry?</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Confirm deleting this ledger transaction. This will modify historical records and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-row gap-3">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(null)} className="flex-1 h-10 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => isDeleteConfirmOpen && handleDelete(isDeleteConfirmOpen)}
              className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-505 text-white"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
