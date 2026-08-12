'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
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
  Eye,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Truck,
  Printer,
  FileDown,
  X,
  PlusCircle,
  CheckCircle2,
  Coins
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  company: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  cost: number;
  quantity: number;
}

interface PurchaseOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  product: Product;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier: Supplier;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  subtotal: number;
  tax: number;
  total: number;
  paymentTerms: string | null;
  createdAt: string;
  items: PurchaseOrderItem[];
}

interface NewPOItem {
  productId: string;
  quantity: number;
  unitCost: number;
  name: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  
  // Data states
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Drawers
  const [isNewPOOpen, setIsNewPOOpen] = useState(false);
  const [activePO, setActivePO] = useState<PurchaseOrder | null>(null);

  // New PO Form states
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<NewPOItem[]>([]);
  const [poStatus, setPoStatus] = useState('PENDING');
  const [paymentTerms, setPaymentTerms] = useState('DUE ON RECEIPT');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/purchase/orders', {
        params: {
          search: debouncedSearch,
          status: statusFilter,
          sortBy,
          sortOrder,
          page,
          limit: 8
        }
      });
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch resources (suppliers & products)
  const fetchResources = async () => {
    try {
      const [suppRes, prodRes] = await Promise.all([
        api.get('/purchase/suppliers'),
        api.get('/inventory?limit=100')
      ]);
      setSuppliers(suppRes.data.suppliers);
      setProducts(prodRes.data.products);
    } catch (err) {
      console.error('Error fetching resources', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [debouncedSearch, statusFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    if (isNewPOOpen) {
      fetchResources();
      setPoItems([{ productId: '', quantity: 1, unitCost: 0, name: '' }]);
      setSelectedSupplierId('');
      setFormErrors({});
    }
  }, [isNewPOOpen]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Status badges mapping
  const getStatusBadge = (status: PurchaseOrder['status']) => {
    if (status === 'RECEIVED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Received
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Cancelled
      </span>
    );
  };

  // Form operations
  const addPOItemRow = () => {
    setPoItems(prev => [...prev, { productId: '', quantity: 1, unitCost: 0, name: '' }]);
  };

  const removePOItemRow = (idx: number) => {
    if (poItems.length === 1) return;
    setPoItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePOItemChange = (idx: number, field: keyof NewPOItem, value: any) => {
    setPoItems(prev => {
      const copy = [...prev];
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        copy[idx] = {
          productId: value,
          quantity: copy[idx].quantity,
          unitCost: prod ? prod.cost : 0,
          name: prod ? prod.name : ''
        };
      } else if (field === 'quantity') {
        copy[idx].quantity = Math.max(1, parseInt(value) || 1);
      } else if (field === 'unitCost') {
        copy[idx].unitCost = Math.max(0, parseFloat(value) || 0);
      }
      return copy;
    });
  };

  // Calculate totals
  const subtotal = poItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const validatePOForm = () => {
    const errors: Record<string, string> = {};
    if (!selectedSupplierId) errors.supplier = 'Please select a supplier';
    
    // Check if any row is empty or invalid
    const invalidItems = poItems.some(i => !i.productId || i.quantity <= 0 || i.unitCost < 0);
    if (invalidItems) {
      errors.items = 'Ensure all items have a product selected and correct quantities/costs';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePOForm()) return;

    setSubmitting(true);
    try {
      await api.post('/purchase/orders', {
        supplierId: selectedSupplierId,
        status: poStatus,
        paymentTerms,
        items: poItems.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost
        }))
      });

      toast.success(poStatus === 'RECEIVED' 
        ? 'Purchase Order received & stock updated!'
        : 'Purchase Order created successfully!'
      );
      setIsNewPOOpen(false);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit Purchase Order');
    } finally {
      setSubmitting(false);
    }
  };

  // Receive PO
  const handleMarkAsReceived = async (id: string) => {
    try {
      const response = await api.patch(`/purchase/orders/${id}/receive`);
      toast.success(response.data.message || 'Stock updated successfully!');
      if (activePO && activePO.id === id) {
        setActivePO(response.data.order);
      }
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark PO as received');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Purchase Orders</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Order inventory from suppliers and manage inbound restocking transactions.</p>
        </div>
        {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user?.role || '') && (
          <Button
            onClick={() => setIsNewPOOpen(true)}
            className="h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-bold flex items-center gap-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 hover:scale-[1.01] active:scale-[0.99] transition-all self-start sm:self-auto"
          >
            <Plus className="h-5 w-5" />
            New Purchase Order
          </Button>
        )}
      </div>

      {/* 2. Filters */}
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-xs" title="Filter this table">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
            <Input
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
              <option value="PENDING">Pending</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 3. PO Table */}
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900/30 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                <th className="p-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('orderNumber')}>
                  <div className="flex items-center gap-1.5">
                    PO Code
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('supplier')}>
                  <div className="flex items-center gap-1.5">
                    Supplier
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-1.5">
                    Order Date
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
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50 text-xs">
              {loading ? (
                [...Array(5)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-8 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto" /></td>
                    <td className="p-4"><div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto" /></td>
                    <td className="p-4"><div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4"><div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mb-4">
                        <Truck className="h-7 w-7" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-850 dark:text-white">No purchase orders found</h3>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                        Create supplier orders to purchase stock and restock warehouses.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const qtySum = order.items.reduce((acc, i) => acc + i.quantity, 0);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{order.orderNumber}</td>
                      <td className="p-4">
                        <div className="font-bold text-neutral-850 dark:text-neutral-200">{order.supplier.name}</div>
                        {order.supplier.company && (
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{order.supplier.company}</div>
                        )}
                      </td>
                      <td className="p-4 text-neutral-500 font-semibold">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-neutral-500 font-semibold">{order.paymentTerms}</td>
                      <td className="p-4 text-right font-semibold text-neutral-600 dark:text-neutral-400">{qtySum}</td>
                      <td className="p-4 text-right font-black text-neutral-900 dark:text-white">
                        ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActivePO(order)}
                            className="h-8 rounded-lg px-2 text-2xs font-bold border-neutral-200 flex items-center gap-1 text-neutral-700 dark:text-neutral-300"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          {order.status === 'PENDING' && ['ADMIN', 'MANAGER'].includes(user?.role || '') && (
                            <Button
                              onClick={() => handleMarkAsReceived(order.id)}
                              className="h-8 rounded-lg px-2 text-2xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Receive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/50 p-4 bg-slate-50/30 dark:bg-neutral-900/10">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing page <span className="font-bold text-neutral-900 dark:text-white">{pagination.page}</span> of{' '}
              <span className="font-bold text-neutral-900 dark:text-white">{pagination.totalPages}</span> ({pagination.total} total POs)
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

      {/* 4. New PO Drawer */}
      <Sheet open={isNewPOOpen} onOpenChange={setIsNewPOOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-850 p-6 flex flex-col h-full overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <SheetTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">New Purchase Order</SheetTitle>
            <SheetDescription className="text-xs text-neutral-500 dark:text-neutral-400">Draft procurement order for inventory restocking.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreatePO} className="space-y-4 py-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Supplier Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className={`w-full h-10.5 rounded-xl border border-neutral-250 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.supplier ? 'border-rose-500 dark:border-rose-500' : ''}`}
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.company ? `(${s.company})` : ''}</option>
                  ))}
                </select>
                {formErrors.supplier && <p className="text-rose-500 text-2xs font-bold">{formErrors.supplier}</p>}
              </div>

              {/* Terms & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full h-10 rounded-xl border border-neutral-250 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none"
                  >
                    <option value="DUE ON RECEIPT">Due On Receipt</option>
                    <option value="NET 15">Net 15</option>
                    <option value="NET 30">Net 30</option>
                    <option value="NET 60">Net 60</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Order Status</label>
                  <select
                    value={poStatus}
                    onChange={(e) => setPoStatus(e.target.value)}
                    className="w-full h-10 rounded-xl border border-neutral-250 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none"
                  >
                    <option value="PENDING">Pending (Draft)</option>
                    <option value="RECEIVED">Received (Restock Immediately)</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-850 dark:text-white">Procured Items</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={addPOItemRow}
                    className="h-8 text-2xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Add Product
                  </Button>
                </div>

                {formErrors.items && <p className="text-rose-500 text-2xs font-bold mb-3">{formErrors.items}</p>}

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {poItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1 min-w-[200px]">
                        <select
                          value={item.productId}
                          onChange={(e) => handlePOItemChange(index, 'productId', e.target.value)}
                          className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none"
                        >
                          <option value="">-- Select Product --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku}) [Cost: ${p.cost}]</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handlePOItemChange(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="h-10 rounded-xl border-neutral-200"
                        />
                      </div>

                      <div className="w-28">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => handlePOItemChange(index, 'unitCost', e.target.value)}
                          placeholder="Unit Cost ($)"
                          className="h-10 rounded-xl border-neutral-200"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePOItemRow(index)}
                        disabled={poItems.length === 1}
                        className="h-10 w-10 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculations and Actions */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-4">
              <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Tax (8%)</span>
                  <span>${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-neutral-900 dark:text-white border-t border-dashed pt-2">
                  <span>Total Amount</span>
                  <span>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewPOOpen(false)}
                  className="flex-1 h-10.5 rounded-xl text-neutral-500 font-bold border-neutral-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  {submitting ? 'Submitting...' : 'Create Order'}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* 5. PO Preview Detail Modal */}
      <Dialog open={activePO !== null} onOpenChange={(open) => !open && setActivePO(null)}>
        <DialogContent className="max-w-2xl rounded-2xl p-0 bg-white dark:bg-neutral-900 overflow-hidden border border-neutral-250 dark:border-neutral-800 shadow-xl">
          {activePO && (
            <>
              {/* Printable Area */}
              <div id="printable-invoice" className="p-6 md:p-8 space-y-6">
                {/* Invoice Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white uppercase">Bizloom Procurement</h2>
                    <p className="text-2xs text-neutral-500 dark:text-neutral-400">Restocking Inbound Order</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Purchase Order</span>
                    <h3 className="text-sm font-mono font-bold text-neutral-850 dark:text-neutral-200 mt-0.5">{activePO.orderNumber}</h3>
                  </div>
                </div>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                {/* Billed To / Billed From */}
                <div className="grid grid-cols-2 gap-4 text-2xs text-neutral-600 dark:text-neutral-400">
                  <div>
                    <span className="font-bold text-neutral-400 uppercase tracking-wider">Ordered From (Supplier):</span>
                    <h4 className="font-black text-xs text-neutral-850 dark:text-white mt-1">{activePO.supplier.name}</h4>
                    {activePO.supplier.company && <p className="font-bold mt-0.5">{activePO.supplier.company}</p>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-neutral-400 uppercase tracking-wider">Ship To (Warehouse):</span>
                    <h4 className="font-black text-xs text-neutral-850 dark:text-white mt-1">Bizloom Central WH</h4>
                    <p className="mt-0.5">100 Tech Blvd, Suite A</p>
                    <p className="mt-0.5">San Francisco, CA 94107</p>
                  </div>
                </div>

                {/* PO metadata */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-neutral-850 p-3 rounded-xl text-3xs font-bold text-neutral-500 dark:text-neutral-400">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-neutral-400">Date Ordered</span>
                    <p className="text-[10px] text-neutral-700 dark:text-neutral-200 mt-0.5">{new Date(activePO.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-neutral-400">Payment Terms</span>
                    <p className="text-[10px] text-neutral-700 dark:text-neutral-200 mt-0.5">{activePO.paymentTerms || 'Due On Receipt'}</p>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-neutral-400">Receipt Status</span>
                    <div className="mt-0.5">{getStatusBadge(activePO.status)}</div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse text-2xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-400">
                      <th className="py-2">Product Name / SKU</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Unit Cost</th>
                      <th className="py-2 text-right">Line Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
                    {activePO.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-2.5">
                          <div className="font-bold text-neutral-850 dark:text-neutral-200">{item.product.name}</div>
                          <div className="text-3xs text-neutral-400 mt-0.5">SKU: {item.product.sku}</div>
                        </td>
                        <td className="py-2.5 text-right font-semibold text-neutral-600 dark:text-neutral-400">{item.quantity}</td>
                        <td className="py-2.5 text-right font-semibold text-neutral-600 dark:text-neutral-400">${item.unitCost.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-bold text-neutral-850 dark:text-white">${(item.quantity * item.unitCost).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end pt-4 border-t">
                  <div className="w-48 space-y-1.5 text-2xs text-neutral-500 dark:text-neutral-400">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-bold text-neutral-750 dark:text-neutral-300">${activePO.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (8%):</span>
                      <span className="font-bold text-neutral-750 dark:text-neutral-300">${activePO.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-neutral-900 dark:text-white border-t border-dashed pt-2">
                      <span>Total Owed:</span>
                      <span>${activePO.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons (not printable) */}
              <div className="p-4 bg-slate-50 dark:bg-neutral-850 border-t flex justify-end gap-2.5 print-hide">
                <Button variant="outline" onClick={() => setActivePO(null)} className="h-9.5 text-xs rounded-xl px-4 text-neutral-500">
                  Close
                </Button>
                
                {activePO.status === 'PENDING' && ['ADMIN', 'MANAGER'].includes(user?.role || '') && (
                  <Button
                    onClick={() => handleMarkAsReceived(activePO.id)}
                    className="h-9.5 text-xs rounded-xl px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Received
                  </Button>
                )}

                <Button
                  onClick={() => {
                    const printArea = document.getElementById('printable-invoice');
                    if (printArea) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write('<html><head><title>Purchase Order ' + activePO.orderNumber + '</title>');
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
                  Print Order
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
