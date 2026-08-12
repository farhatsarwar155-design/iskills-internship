'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  FileDown,
  Printer,
  ChevronDown,
  ArrowUpDown,
  ShoppingBag,
  User,
  Calendar,
  CreditCard,
  Trash2,
  Eye,
  Percent,
  PlusCircle,
  X,
  FileText,
  ShieldCheck,
  CircleDollarSign
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string | null;
  address: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: Customer;
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
  subtotal: number;
  tax: number;
  total: number;
  paymentTerms: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface NewOrderItem {
  productId: string;
  quantity: number;
  price: number;
  maxQty: number;
  name: string;
}

export default function SalesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Data lists
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter query states
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Drawers
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // New Sale Form
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saleItems, setSaleItems] = useState<NewOrderItem[]>([]);
  const [saleStatus, setSaleStatus] = useState('UNPAID');
  const [paymentTerms, setPaymentTerms] = useState('DUE ON RECEIPT');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch orders list
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales/orders', {
        params: { search: debouncedSearch, status: statusFilter, sortBy, sortOrder, page, limit: 8 }
      });
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch active customers and products for selection
  const fetchResources = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/sales/customers'),
        api.get('/inventory?limit=100')
      ]);
      setCustomers(custRes.data.customers);
      setProducts(prodRes.data.products);
    } catch (err) {
      console.error('Error loading resources', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [debouncedSearch, statusFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    if (searchParams.get('openDrawer') === 'true') {
      setIsNewSaleOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isNewSaleOpen) {
      fetchResources();
      // Initialize with one empty item line
      setSaleItems([{ productId: '', quantity: 1, price: 0, maxQty: 0, name: '' }]);
      setSelectedCustomerId('');
      setFormErrors({});
    }
  }, [isNewSaleOpen]);

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Order status badge formatter
  const getStatusBadge = (status: Order['status']) => {
    if (status === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-2xs font-extrabold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
          Paid
        </span>
      );
    }
    if (status === 'PARTIAL') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-2xs font-extrabold text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
          Partial
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-2xs font-extrabold text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
        Unpaid
      </span>
    );
  };

  // Add Item Line
  const addSaleItemLine = () => {
    setSaleItems(prev => [...prev, { productId: '', quantity: 1, price: 0, maxQty: 0, name: '' }]);
  };

  // Remove Item Line
  const removeSaleItemLine = (idx: number) => {
    setSaleItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle Item Select
  const handleItemProductChange = (idx: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setSaleItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return {
          productId: product.id,
          quantity: 1,
          price: product.price,
          maxQty: product.quantity,
          name: product.name
        };
      }
      return item;
    }));
  };

  // Handle Item Qty Change
  const handleItemQtyChange = (idx: number, qty: number) => {
    setSaleItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  // Form Subtotal and totals calculation
  const calculateInvoiceSummary = () => {
    const subtotal = saleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal: orderSubtotal, tax: orderTax, total: orderTotal } = calculateInvoiceSummary();

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!selectedCustomerId) errors.customer = 'Please select a customer';
    
    if (saleItems.length === 0) {
      errors.items = 'Please add at least one product line';
    } else {
      const invalidLines = saleItems.some(i => !i.productId || i.quantity <= 0);
      if (invalidLines) {
        errors.items = 'Please ensure all item lines have a product and valid quantity';
      }
      
      const stockErrors = saleItems.some(i => i.quantity > i.maxQty);
      if (stockErrors) {
        errors.items = 'Some items exceed available inventory quantities';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Order Checkout
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await api.post('/sales/orders', {
        customerId: selectedCustomerId,
        items: saleItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        status: saleStatus,
        paymentTerms
      });
      toast.success('Sales Order processed successfully!');
      setIsNewSaleOpen(false);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error processing sale order');
    } finally {
      setSubmitting(false);
    }
  };

  // Print Invoice trigger
  const handlePrint = () => {
    window.print();
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Order #', 'Customer', 'Status', 'Total', 'Date'];
    const rows = orders.map(o => [
      o.orderNumber,
      o.customer?.name || '',
      o.status,
      o.total.toFixed(2),
      new Date(o.createdAt).toLocaleDateString()
    ]);
    exportToCSV(headers, rows, `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ['Order #', 'Customer', 'Status', 'Total'];
    const rows = orders.map(o => [
      o.orderNumber,
      o.customer?.name || '',
      o.status,
      `$${o.total.toFixed(2)}`
    ]);
    exportToPDF('Sales Orders', headers, rows, `orders_export_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Sales & Invoices</h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Generate invoices, process checkouts, adjust orders, and export financial logs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <div className="relative">
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

          {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user?.role || '') && (
            <Button
              onClick={() => setIsNewSaleOpen(true)}
              className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 dark:bg-indigo-50 dark:hover:bg-indigo-400 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Plus className="h-5 w-5" />
              New Sale Order
            </Button>
          )}
        </div>
      </div>

      {/* 2. Filter toolbar */}
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900/90 shadow-sm p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-xs" title="Filter this table">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
            <Input
              type="text"
              placeholder="Filter this table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-neutral-200 bg-slate-50/50 dark:border-neutral-800 focus:bg-white transition-all text-xs font-semibold text-neutral-600 dark:text-neutral-450"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none"
            >
              <option value="all">All Orders</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 3. Orders Table */}
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900/30 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                <th className="p-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('orderNumber')}>
                  <div className="flex items-center gap-1.5">
                    Order Code
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('customer')}>
                  <div className="flex items-center gap-1.5">
                    Customer
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-1.5">
                    Billing Date
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4">Payment Terms</th>
                <th className="p-4 text-right">Items Qty</th>
                <th className="p-4 text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-end gap-1.5">
                    Total Amount
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Invoice</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50 text-xs">
              {loading ? (
                // Skeletons
                [...Array(5)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4">
                      <div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
                      <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded opacity-60" />
                    </td>
                    <td className="p-4"><div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-8 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto" /></td>
                    <td className="p-4"><div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto" /></td>
                    <td className="p-4"><div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4"><div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mb-4">
                        <ShoppingBag className="h-7 w-7" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-800 dark:text-white">No sales orders found</h3>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
                        Create a new sale order transaction to generate invoice records.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const qtySum = order.items.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{order.orderNumber}</td>
                      <td className="p-4">
                        <div className="font-bold text-neutral-850 dark:text-neutral-200">{order.customer.name}</div>
                        {order.customer.company && (
                          <div className="text-[10px] text-neutral-450 dark:text-neutral-500">{order.customer.company}</div>
                        )}
                      </td>
                      <td className="p-4 text-neutral-500 font-semibold">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-neutral-500 font-semibold">{order.paymentTerms}</td>
                      <td className="p-4 text-right font-semibold text-neutral-600 dark:text-neutral-400">{qtySum}</td>
                      <td className="p-4 text-right font-black text-neutral-900 dark:text-white">
                        ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveInvoice(order)}
                          className="h-8 rounded-lg px-2 text-2xs font-bold border-neutral-200 flex items-center gap-1 text-neutral-700 dark:text-neutral-300 mx-auto"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Invoice
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/50 p-4 bg-slate-50/30 dark:bg-neutral-900/10">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing page <span className="font-bold text-neutral-900 dark:text-white">{pagination.page}</span> of{' '}
              <span className="font-bold text-neutral-900 dark:text-white">{pagination.totalPages}</span> ({pagination.total} total orders)
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
                onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={page === pagination.totalPages}
                className="h-8 rounded-lg px-3 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 4. New Sale Checkout Drawer (Sheet) */}
      <Sheet open={isNewSaleOpen} onOpenChange={setIsNewSaleOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-850 p-6 flex flex-col h-full overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <SheetTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">New Sale Order</SheetTitle>
            <SheetDescription className="text-xs text-neutral-500 dark:text-neutral-400">Checkout products and create invoices for customers.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreateOrder} className="space-y-4 py-4 flex-1 flex flex-col">
            {/* Customer Select */}
            <div className="space-y-1.5">
              <label htmlFor="customer" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Select Customer *</label>
              <select
                id="customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-neutral-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-650 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
              >
                <option value="">-- Choose a Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                ))}
              </select>
              {formErrors.customer && <span className="text-[10px] text-rose-500 font-semibold">{formErrors.customer}</span>}
            </div>

            {/* Terms and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="paymentTerms" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Payment Terms</label>
                <select
                  id="paymentTerms"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-neutral-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
                >
                  <option value="DUE ON RECEIPT">Due On Receipt</option>
                  <option value="NET 15">NET 15</option>
                  <option value="NET 30">NET 30</option>
                  <option value="NET 60">NET 60</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="status" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Payment Status</label>
                <select
                  id="status"
                  value={saleStatus}
                  onChange={(e) => setSaleStatus(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-neutral-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
                >
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>

            {/* Itemized lines */}
            <div className="flex-1 space-y-3 mt-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Itemized Products *</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={addSaleItemLine}
                  className="h-8 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" /> Add Item Line
                </Button>
              </div>

              {formErrors.items && <div className="text-[10px] text-rose-500 font-bold">{formErrors.items}</div>}

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {saleItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2.5 items-end bg-slate-50 dark:bg-neutral-950 border p-3 rounded-xl relative group">
                    {/* Product picker */}
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemProductChange(idx, e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-2xs font-semibold focus:outline-none dark:border-neutral-800 dark:bg-neutral-900"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                            {p.name} (${p.price} | Qty: {p.quantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity field */}
                    <div className="w-20 space-y-1">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Qty</label>
                      <Input
                        type="number"
                        min="1"
                        max={item.maxQty || 100}
                        value={item.quantity}
                        onChange={(e) => handleItemQtyChange(idx, parseInt(e.target.value) || 0)}
                        className="h-9 rounded-lg text-2xs text-right pr-2"
                      />
                    </div>

                    {/* Unit price block */}
                    <div className="w-20 text-right space-y-1 p-2 shrink-0">
                      <span className="text-[9px] font-bold text-neutral-400 block uppercase tracking-wider">Price</span>
                      <span className="font-bold text-2xs text-neutral-700 dark:text-neutral-300">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeSaleItemLine(idx)}
                      disabled={saleItems.length === 1}
                      className="h-9 w-9 shrink-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="mt-4 border-t border-neutral-200 dark:border-neutral-800 pt-4 bg-slate-50 dark:bg-neutral-950/40 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-neutral-600 dark:text-neutral-400">
                <span>Subtotal</span>
                <span>${orderSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-semibold text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  Tax
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded">8%</span>
                </span>
                <span>${orderTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-neutral-900 dark:text-white pt-2 border-t border-neutral-200/50">
                <span>Grand Total</span>
                <span>${orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Form footer */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewSaleOpen(false)}
                className="flex-1 h-11 rounded-xl text-neutral-500 border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold dark:bg-indigo-50 dark:hover:bg-indigo-400"
              >
                {submitting ? 'Processing Checkout...' : 'Confirm checkout'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* 5. Printable Invoice Preview (Dialog) */}
      <Dialog open={activeInvoice !== null} onOpenChange={(open) => !open && setActiveInvoice(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-850 p-0 rounded-2xl overflow-hidden max-h-[92vh] flex flex-col">
          {activeInvoice && (
            <>
              {/* Inner scroll container for preview */}
              <div className="p-6 md:p-8 flex-1 overflow-y-auto print-area" id="printable-invoice">
                {/* Print Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-6 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
                        <ShieldCheck className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">Bizloom Inc.</span>
                    </div>
                    <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 leading-normal max-w-xs">
                      100 Enterprise Way, Suite 400<br />
                      Silicon Valley, CA 94025<br />
                      billing@bizloom.com
                    </p>
                  </div>
                  <div className="text-left sm:text-right space-y-1 text-xs">
                    <h2 className="text-base font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Sales Invoice</h2>
                    <div className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{activeInvoice.orderNumber}</div>
                    <div className="text-neutral-400 dark:text-neutral-500 font-semibold">Date: {new Date(activeInvoice.createdAt).toLocaleDateString()}</div>
                    <div className="text-neutral-400 dark:text-neutral-500 font-semibold">Due: {activeInvoice.paymentTerms}</div>
                  </div>
                </div>

                {/* Bill To */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 text-xs leading-normal">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Billed To:</span>
                    <div className="font-extrabold text-neutral-850 dark:text-neutral-100">{activeInvoice.customer.name}</div>
                    {activeInvoice.customer.company && <div className="font-bold text-neutral-600 dark:text-neutral-300">{activeInvoice.customer.company}</div>}
                    <div className="text-neutral-500 dark:text-neutral-400">{activeInvoice.customer.email}</div>
                    {activeInvoice.customer.address && <div className="text-neutral-500 dark:text-neutral-400 max-w-xs whitespace-pre-line">{activeInvoice.customer.address}</div>}
                  </div>
                  <div className="space-y-2 bg-slate-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-850 h-fit self-center">
                    <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      <span>Status</span>
                      <span>Payment Method</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      {getStatusBadge(activeInvoice.status)}
                      <span className="font-bold text-neutral-700 dark:text-neutral-300">Bank Transfer</span>
                    </div>
                  </div>
                </div>

                {/* Itemsized Ledger Table */}
                <div className="mt-4">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-neutral-850/50 border-b border-neutral-200/50 dark:border-neutral-800 font-bold text-neutral-500">
                        <th className="p-3">Item Description</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40 text-neutral-700 dark:text-neutral-300">
                      {activeInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="p-3 font-bold">{item.product?.name || 'Deleted Product'}</td>
                          <td className="p-3 font-mono text-[10px] text-neutral-450 dark:text-neutral-500">{item.product?.sku || 'N/A'}</td>
                          <td className="p-3 text-right font-semibold">{item.quantity}</td>
                          <td className="p-3 text-right font-semibold">${item.price.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-neutral-850 dark:text-neutral-200">${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom calculations */}
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-between items-start gap-4">
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal">
                    <span className="font-bold text-neutral-550 dark:text-neutral-350 block mb-1">Payment Instructions:</span>
                    Please wire funds to account #9988-2211-44<br />
                    SWIFT code: BIZLUS33<br />
                    Payment terms: {activeInvoice.paymentTerms || 'Net 30'}.
                  </div>
                  <div className="w-full sm:w-64 bg-slate-50 dark:bg-neutral-950 p-4 border rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between text-neutral-500 font-semibold">
                      <span>Subtotal</span>
                      <span>${activeInvoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-neutral-500 font-semibold">
                      <span>Tax (8%)</span>
                      <span>${activeInvoice.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-black text-neutral-850 dark:text-neutral-100 text-sm">
                      <span>Amount Due</span>
                      <span className="text-indigo-600 dark:text-indigo-400">${activeInvoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons (not printable) */}
              <div className="p-4 bg-slate-50 dark:bg-neutral-850 border-t flex justify-end gap-2.5 print-hide">
                <Button variant="outline" onClick={() => setActiveInvoice(null)} className="h-9.5 text-xs rounded-xl px-4 text-neutral-500">
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const printArea = document.getElementById('printable-invoice');
                    if (printArea) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write('<html><head><title>Invoice ' + activeInvoice.orderNumber + '</title>');
                        printWindow.document.write('<style>body{font-family:system-ui,sans-serif;padding:40px;color:#111}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;text-align:left;font-size:12px}th{background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;color:#64748b}td{border-bottom:1px solid #f1f5f9}.text-right{text-align:right}.font-bold{font-weight:700}.font-mono{font-family:monospace}</style>');
                        printWindow.document.write('</head><body>');
                        printWindow.document.write(printArea.innerHTML);
                        printWindow.document.write('</body></html>');
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }
                  }}
                  variant="outline"
                  className="h-9.5 text-xs rounded-xl px-4 font-bold flex items-center gap-1.5"
                >
                  <FileDown className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={handlePrint} className="h-9.5 text-xs rounded-xl px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                  <Printer className="h-4 w-4" />
                  Print Invoice
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
