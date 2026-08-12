'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/lib/api';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
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
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  Trash2,
  Edit2,
  FileDown,
  Eye,
  TrendingUp,
  AlertTriangle,
  History,
  Info,
  Calendar,
  X,
  PlusCircle,
  PackageOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  cost: number;
  quantity: number;
  minStockLevel: number;
  category: string;
  createdAt: string;
  avgDailySales?: number;
  estimatedDaysUntilStockout?: number | null;
  stockoutRisk?: 'CRITICAL' | 'WARNING' | 'MODERATE' | 'SAFE';
  suggestedReorder?: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  
  // Products states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Table query states
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  
  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals / Drawers states
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Form states & validation errors
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    cost: '',
    quantity: '',
    minStockLevel: '5',
    category: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch products lists
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory', {
        params: {
          search: debouncedSearch,
          category: categoryFilter,
          stockStatus: statusFilter,
          sortBy,
          sortOrder,
          page,
          limit: 8
        }
      });
      setProducts(response.data.products);
      setCategories(response.data.categories);
      setPagination(response.data.pagination);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error fetching products data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, categoryFilter, statusFilter, sortBy, sortOrder, page]);

  // Open drawer when ?openDrawer=true is present in URL
  useEffect(() => {
    if (searchParams.get('openDrawer') === 'true') {
      setEditingProduct(null);
      setFormData({ name: '', sku: '', description: '', price: '', cost: '', quantity: '', minStockLevel: '5', category: '' });
      setFormErrors({});
      setIsAddDrawerOpen(true);
    }
  }, [searchParams]);

  // Fetch product history
  const fetchProductHistory = async (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
    setLoadingHistory(true);
    try {
      const response = await api.get(`/inventory/${product.id}/history`);
      // Compute cumulative quantity graph points
      let accum = 0;
      const historyChartData = response.data.history.map((log: any) => {
        accum += log.change;
        return {
          date: new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          stockLevel: accum,
          change: log.change,
          type: log.type,
          notes: log.notes || log.type
        };
      });
      setStockHistory(historyChartData);
    } catch (err) {
      toast.error('Failed to load stock history');
    } finally {
      setLoadingHistory(false);
    }
  };

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

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // Form input validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    
    const priceVal = parseFloat(formData.price);
    if (isNaN(priceVal) || priceVal <= 0) {
      errors.price = 'Price must be a number greater than 0';
    }

    const costVal = parseFloat(formData.cost);
    if (isNaN(costVal) || costVal < 0) {
      errors.cost = 'Cost must be a positive number';
    } else if (costVal >= priceVal) {
      errors.cost = 'Cost should be less than the selling price';
    }

    const qtyVal = parseInt(formData.quantity);
    if (isNaN(qtyVal) || qtyVal < 0) {
      errors.quantity = 'Quantity must be a positive integer';
    }

    const minStock = parseInt(formData.minStockLevel);
    if (isNaN(minStock) || minStock < 0) {
      errors.minStockLevel = 'Min stock level must be positive';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error on change
    if (formErrors[name]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Open edit drawer with pre-filled data
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: String(product.price),
      cost: String(product.cost),
      quantity: String(product.quantity),
      minStockLevel: String(product.minStockLevel),
      category: product.category
    });
    setFormErrors({});
    setIsAddDrawerOpen(true);
  };

  // Add / Edit Product Submit
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingProduct) {
        await api.put(`/inventory/${editingProduct.id}`, formData);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/inventory', formData);
        toast.success('Product added successfully!');
      }
      setIsAddDrawerOpen(false);
      setEditingProduct(null);
      // Reset form
      setFormData({
        name: '',
        sku: '',
        description: '',
        price: '',
        cost: '',
        quantity: '',
        minStockLevel: '5',
        category: ''
      });
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product action
  const handleDeleteProduct = async (id: string) => {
    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Product deleted successfully');
      setIsDeleteConfirmOpen(null);
      setSelectedIds(prev => prev.filter(item => item !== id));
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting product');
      setIsDeleteConfirmOpen(null);
    }
  };

  // Bulk delete action
  const handleBulkDelete = async () => {
    try {
      await api.post('/inventory/bulk-delete', { ids: selectedIds });
      toast.success('Selected products deleted successfully');
      setSelectedIds([]);
      setIsBulkDeleteConfirmOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting products in bulk');
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  // Export CSV/PDF helpers
  const handleExportCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Quantity', 'Min Stock'];
    const rows = products.map(p => [p.name, p.sku, p.category, p.price.toFixed(2), p.cost.toFixed(2), p.quantity, p.minStockLevel]);
    exportToCSV(headers, rows, `inventory_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Qty'];
    const rows = products.map(p => [p.name, p.sku, p.category, `$${p.price.toFixed(2)}`, p.quantity]);
    exportToPDF('Inventory Report', headers, rows, `inventory_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // Stock status styling helpers
  const getStockBadge = (product: Product) => {
    const qty = product.quantity;
    const min = product.minStockLevel;
    const estDays = product.estimatedDaysUntilStockout;

    if (qty === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Out of Stock
        </span>
      );
    }

    if (estDays !== undefined && estDays !== null) {
      const isCritical = estDays <= 3;
      const isWarning = estDays <= 7;
      const isModerate = estDays <= 14;

      const badgeColor = isCritical 
        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' 
        : isWarning 
        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 animate-pulse'
        : isModerate
        ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30'
        : 'bg-emerald-50 text-emerald-700 border-emerald-250/50 dark:bg-emerald-950/20 dark:text-emerald-400';

      return (
        <div className="flex flex-col gap-1 items-start">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${badgeColor}`}>
            {isCritical && <AlertTriangle className="h-3 w-3" />}
            {qty <= min ? 'Low Stock' : 'In Stock'}
          </span>
          <span className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest pl-1">
            Est. {estDays} days left
          </span>
          {product.suggestedReorder && product.suggestedReorder > 0 ? (
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Reorder {product.suggestedReorder} units
            </span>
          ) : null}
        </div>
      );
    }

    if (qty <= min) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse">
          <AlertTriangle className="h-3.5 w-3.5" />
          Low Stock
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        In Stock
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Inventory</h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Control items, trace stock logs, audit low quantities, and adjust listings.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
              className="h-10 rounded-xl bg-white dark:bg-neutral-900 border-rose-200 dark:border-rose-900/30 text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2"
            >
              <Trash2 className="h-4.5 w-4.5" />
              Delete Selected ({selectedIds.length})
            </Button>
          )}

          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setExportMenuOpen(prev => !prev)}
              className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-2 hover:bg-slate-50"
            >
              <FileDown className="h-4.5 w-4.5" />
              Export
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => { handleExportCSV(); setExportMenuOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  📄 Export as CSV
                </button>
                <button
                  onClick={() => { handleExportPDF(); setExportMenuOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  📋 Export as PDF
                </button>
              </div>
            )}
          </div>

          {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
            <Button
              onClick={() => {
                setEditingProduct(null);
                setFormData({ name: '', sku: '', description: '', price: '', cost: '', quantity: '', minStockLevel: '5', category: '' });
                setFormErrors({});
                setIsAddDrawerOpen(true);
              }}
              className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Plus className="h-5 w-5" />
              Add Product
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

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">All Stock Status</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Table list */}
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900/30 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-600 dark:border-neutral-850 dark:bg-neutral-950"
                  />
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    Product
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('sku')}>
                  <div className="flex items-center gap-1.5">
                    SKU
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1.5">
                    Category
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('price')}>
                  <div className="flex items-center justify-end gap-1.5">
                    Price
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center justify-end gap-1.5">
                    Qty
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-800/20" onClick={() => handleSort('estimatedDaysUntilStockout')}>
                  <div className="flex items-center gap-1.5">
                    Status / Urgency
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50 text-xs">
              {loading ? (
                // Skeletons Table Loader
                [...Array(6)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-4 w-4 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" /></td>
                    <td className="p-4">
                      <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
                      <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded opacity-60" />
                    </td>
                    <td className="p-4"><div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto" /></td>
                    <td className="p-4"><div className="h-4 w-8 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto" /></td>
                    <td className="p-4"><div className="h-6 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="p-4"><div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                // Clean designed empty list illustration
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mb-4">
                        <PackageOpen className="h-7 w-7" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-800 dark:text-white">No products found</h3>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
                        Adjust your keywords or register a new product to populate the ledger.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isRowSelected = selectedIds.includes(product.id);
                  const isLow = product.quantity <= product.minStockLevel && product.quantity > 0;
                  const isOut = product.quantity === 0;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-neutral-800/20 transition-colors duration-100 ${
                        isRowSelected ? 'bg-indigo-50/10 dark:bg-indigo-950/5' : ''
                      } ${isLow ? 'bg-amber-50/5 dark:bg-amber-950/2' : ''} ${isOut ? 'bg-rose-50/5 dark:bg-rose-950/2' : ''}`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => handleSelectRow(product.id)}
                          className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-600 dark:border-neutral-850 dark:bg-neutral-950"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">{product.name}</div>
                        {product.description && (
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate max-w-xs">{product.description}</div>
                        )}
                      </td>
                      <td className="p-4 font-mono font-semibold text-neutral-600 dark:text-neutral-400">{product.sku}</td>
                      <td className="p-4 font-semibold text-neutral-500 dark:text-neutral-400">{product.category}</td>
                      <td className="p-4 text-right font-bold text-neutral-800 dark:text-neutral-200">
                        ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`p-4 text-right font-black ${
                        isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-800 dark:text-neutral-200'
                      }`}>
                        {product.quantity.toLocaleString()}
                      </td>
                      <td className="p-4">{getStockBadge(product)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchProductHistory(product)}
                            className="h-8 w-8 text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg"
                            title="View Detail History"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(product)}
                                className="h-8 w-8 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg"
                                title="Edit Product"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {(product.estimatedDaysUntilStockout !== undefined && product.estimatedDaysUntilStockout !== null && product.estimatedDaysUntilStockout <= 7 && product.suggestedReorder && product.suggestedReorder > 0) ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    window.location.href = `/dashboard/purchases?openDrawer=true&product=${encodeURIComponent(product.sku)}&quantity=${product.suggestedReorder}`;
                                  }}
                                  className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg animate-pulse"
                                  title={`Generate PO for ${product.suggestedReorder} units`}
                                >
                                  <FileDown className="h-4 w-4" />
                                </Button>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsDeleteConfirmOpen(product.id)}
                                className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                                title="Delete Product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
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

        {/* 4. Pagination panel */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/50 p-4 bg-slate-50/30 dark:bg-neutral-900/10">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing page <span className="font-bold text-neutral-900 dark:text-white">{pagination.page}</span> of{' '}
              <span className="font-bold text-neutral-900 dark:text-white">{pagination.totalPages}</span> ({pagination.total} total items)
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

      {/* 5. Add Product Drawer (Sheet) */}
      <Sheet open={isAddDrawerOpen} onOpenChange={(open) => { setIsAddDrawerOpen(open); if (!open) setEditingProduct(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-850 p-6 flex flex-col h-full overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <SheetTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{editingProduct ? 'Edit Product' : 'Add Product'}</SheetTitle>
            <SheetDescription className="text-xs text-neutral-500 dark:text-neutral-400">{editingProduct ? 'Update this product\'s details.' : 'Create a new item in your inventory catalogue.'}</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmitProduct} className="space-y-4 py-4 flex-1">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Product Name *</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.name ? 'border-rose-500' : ''}`}
                placeholder="e.g. Wireless Keyboard"
              />
              {formErrors.name && <span className="text-[10px] text-rose-500 font-semibold">{formErrors.name}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="sku" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">SKU Code *</label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.sku ? 'border-rose-500' : ''}`}
                  placeholder="e.g. KB-WL-101"
                />
                {formErrors.sku && <span className="text-[10px] text-rose-500 font-semibold">{formErrors.sku}</span>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="category" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Category *</label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.category ? 'border-rose-500' : ''}`}
                  placeholder="e.g. Accessories"
                />
                {formErrors.category && <span className="text-[10px] text-rose-500 font-semibold">{formErrors.category}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="price" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Price ($) *</label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.price ? 'border-rose-500' : ''}`}
                  placeholder="0.00"
                />
                {formErrors.price && <span className="text-[10px] text-rose-500 font-semibold">{formErrors.price}</span>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cost" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Cost ($) *</label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={handleInputChange}
                  className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.cost ? 'border-rose-500' : ''}`}
                  placeholder="0.00"
                />
                {formErrors.cost && <span className="text-[10px] text-rose-500 font-semibold">{formErrors.cost}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="quantity" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">{editingProduct ? 'Current Qty *' : 'Initial Qty *'}</label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.quantity ? 'border-rose-500' : ''}`}
                  placeholder="0"
                />
                {formErrors.quantity && <span className="text-[10px] text-rose-500 font-semibold">{formErrors.quantity}</span>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="minStockLevel" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Low Stock Threshold</label>
                <Input
                  id="minStockLevel"
                  name="minStockLevel"
                  type="number"
                  value={formData.minStockLevel}
                  onChange={handleInputChange}
                  className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.minStockLevel ? 'border-rose-500' : ''}`}
                  placeholder="5"
                />
                {formErrors.minStockLevel && <span className="text-[10px] text-rose-500 font-semibold">{formErrors.minStockLevel}</span>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full min-h-[80px] p-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                placeholder="Product summary details..."
              />
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDrawerOpen(false)}
                className="flex-1 h-10.5 rounded-xl text-neutral-500 border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {submitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Save Product')}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* 6. Product Detail View with History Recharts (Dialog) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <DialogTitle className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center justify-between">
                  <span>{selectedProduct.name}</span>
                  <span className="font-mono text-xs font-semibold text-neutral-500 bg-slate-50 dark:bg-neutral-800 rounded px-2 py-0.5 border">
                    {selectedProduct.sku}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">Detailed overview and historical stock analytics.</DialogDescription>
              </DialogHeader>

              {/* Info panel */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 py-4 text-xs">
                <div className="bg-slate-50/50 dark:bg-neutral-900/50 border rounded-xl p-3">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Current Stock</div>
                  <div className="mt-1 text-lg font-black text-neutral-800 dark:text-neutral-200">{selectedProduct.quantity}</div>
                </div>
                <div className="bg-slate-50/50 dark:bg-neutral-900/50 border rounded-xl p-3">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Selling Price</div>
                  <div className="mt-1 text-lg font-black text-neutral-800 dark:text-neutral-200">${selectedProduct.price}</div>
                </div>
                <div className="bg-slate-50/50 dark:bg-neutral-900/50 border rounded-xl p-3">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Acquisition Cost</div>
                  <div className="mt-1 text-lg font-black text-neutral-800 dark:text-neutral-200">${selectedProduct.cost}</div>
                </div>
                <div className="bg-slate-50/50 dark:bg-neutral-900/50 border rounded-xl p-3">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Category</div>
                  <div className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{selectedProduct.category}</div>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-100 dark:border-neutral-850">
                  <span className="font-bold block mb-1">Description:</span>
                  {selectedProduct.description}
                </div>
              )}

              {/* Stock History Line Chart */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <History className="h-4 w-4 text-indigo-500" />
                  Inventory Level Trend
                </h4>
                {loadingHistory ? (
                  <div className="h-44 w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 rounded-xl animate-pulse">
                    <span className="text-xs text-neutral-400">Loading audit history...</span>
                  </div>
                ) : stockHistory.length === 0 ? (
                  <div className="h-44 w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 rounded-xl border border-dashed">
                    <span className="text-xs text-neutral-400">No stock logs logged.</span>
                  </div>
                ) : (
                  <div className="h-44 w-full pt-1.5 bg-slate-50/50 dark:bg-neutral-950/20 border rounded-xl overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stockHistory} margin={{ top: 10, right: 25, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-30" />
                        <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-lg border bg-white dark:bg-neutral-900 p-2 shadow-md text-[10px]">
                                  <div className="font-bold mb-1 text-neutral-800 dark:text-neutral-200">{payload[0].payload.date}</div>
                                  <div className="flex gap-2">
                                    <span className="text-neutral-500">Stock level:</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{payload[0].value} units</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-neutral-500">Change:</span>
                                    <span className={`font-bold ${payload[0].payload.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {payload[0].payload.change >= 0 ? `+${payload[0].payload.change}` : payload[0].payload.change}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line type="monotone" dataKey="stockLevel" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* History Table */}
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-300 uppercase tracking-wider">Adjustment Audit Log</h4>
                <div className="max-h-40 overflow-y-auto border border-neutral-200/50 dark:border-neutral-800 rounded-xl">
                  <table className="w-full text-left text-2xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-neutral-850/50 border-b border-neutral-200/60 dark:border-neutral-800 font-bold text-neutral-500">
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5 text-right">Adjustment</th>
                        <th className="p-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-neutral-600 dark:text-neutral-400">
                      {stockHistory.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-neutral-850/20">
                          <td className="p-2.5">{log.date}</td>
                          <td className="p-2.5 font-bold uppercase">{log.type}</td>
                          <td className={`p-2.5 text-right font-bold ${log.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {log.change >= 0 ? `+${log.change}` : log.change}
                          </td>
                          <td className="p-2.5 truncate max-w-xs">{log.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <DialogFooter className="mt-4 pt-3 border-t">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="h-9 text-xs rounded-xl px-4">
                  Close overview
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen !== null} onOpenChange={(open) => !open && setIsDeleteConfirmOpen(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5.5 w-5.5 text-rose-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Are you sure you want to delete this product? This action cannot be undone and will fail if the product is linked to sales orders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(null)} className="flex-1 h-9.5 text-xs rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => isDeleteConfirmOpen && handleDeleteProduct(isDeleteConfirmOpen)}
              className="flex-1 h-9.5 text-xs rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5.5 w-5.5 text-rose-500" />
              Bulk Delete Products
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Are you sure you want to delete the {selectedIds.length} selected products? This action cannot be undone and will fail if any of them are associated with existing orders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkDeleteConfirmOpen(false)} className="flex-1 h-9.5 text-xs rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleBulkDelete}
              className="flex-1 h-9.5 text-xs rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              Delete Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
