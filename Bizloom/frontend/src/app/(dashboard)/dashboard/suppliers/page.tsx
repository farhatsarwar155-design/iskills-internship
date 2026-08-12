'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/lib/api';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
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
  Mail,
  Phone,
  Building2,
  MapPin,
  Edit2,
  Trash2,
  AlertTriangle,
  Contact,
  FileDown,
  ChevronDown
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  company: string | null;
  createdAt: string;
}

export default function SuppliersPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Modal / Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Form fields & validation errors
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch suppliers list
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/purchase/suppliers', {
        params: { search: debouncedSearch }
      });
      setSuppliers(response.data.suppliers);
    } catch (err) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [debouncedSearch]);

  // Open drawer if URL contains ?openDrawer=true
  useEffect(() => {
    if (searchParams.get('openDrawer') === 'true') {
      handleOpenCreate();
    }
  }, [searchParams]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company'];
    const rows = suppliers.map(s => [
      s.name,
      s.email,
      s.phone || '',
      s.company || ''
    ]);
    exportToCSV(headers, rows, `suppliers_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ['Name', 'Email', 'Company'];
    const rows = suppliers.map(s => [
      s.name,
      s.email,
      s.company || ''
    ]);
    exportToPDF('Suppliers List', headers, rows, `suppliers_export_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Open drawer for creating
  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: ''
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  // Open drawer for editing
  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone || '',
      company: supplier.company || '',
      address: supplier.address || ''
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please provide a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Submit Drawer Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingSupplier) {
        // Edit Supplier
        await api.put(`/purchase/suppliers/${editingSupplier.id}`, formData);
        toast.success('Supplier details updated');
      } else {
        // Create Supplier
        await api.post('/purchase/suppliers', formData);
        toast.success('Supplier registered successfully');
      }
      setIsDrawerOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error processing request');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Supplier Action
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/purchase/suppliers/${id}`);
      toast.success('Supplier profile deleted');
      setIsDeleteConfirmOpen(null);
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete supplier');
    }
  };

  // Get Avatar Initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Supplier Directory</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage supply partners, wholesale vendors and billing contacts.</p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Export Dropdown */}
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

          {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
            <Button
              onClick={handleOpenCreate}
              className="h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-bold flex items-center gap-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Plus className="h-5 w-5" />
              Add Supplier
            </Button>
          )}
        </div>
      </div>

      {/* 2. Search Box */}
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm p-4">
        <div className="relative max-w-xs" title="Filter this table">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
          <Input
            placeholder="Filter this table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl border-neutral-200 bg-slate-50/50 dark:border-neutral-800 focus:bg-white transition-all text-xs font-semibold text-neutral-600 dark:text-neutral-450"
          />
        </div>
      </Card>

      {/* 3. Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse border border-neutral-200/50 dark:border-neutral-800/70">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-850" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-850 rounded" />
                    <div className="h-3 w-1/3 bg-neutral-200 dark:bg-neutral-850 rounded" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
                  <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-850 rounded" />
                  <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-850 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-16 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mb-4">
              <Contact className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-neutral-850 dark:text-white">No suppliers registered</h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
              Add your wholesale inventory vendors to place and track supplier purchase orders.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map(supplier => (
            <Card key={supplier.id} className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 hover:shadow-md transition-all group overflow-hidden">
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 rounded-full border border-indigo-100 dark:border-indigo-950 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                      <AvatarFallback className="font-bold text-xs">{getInitials(supplier.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{supplier.name}</h3>
                      {supplier.company && (
                        <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {supplier.company}
                        </p>
                      )}
                    </div>
                  </div>

                  {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(supplier)}
                        className="h-8 w-8 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                        title="Edit Supplier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsDeleteConfirmOpen(supplier.id)}
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                        title="Delete Supplier"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800/50 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2 leading-relaxed">{supplier.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 4. Add/Edit Supplier Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-850 p-6 flex flex-col h-full overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <SheetTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {editingSupplier ? 'Edit Supplier' : 'Register Supplier'}
            </SheetTitle>
            <SheetDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              {editingSupplier ? "Update supply partner's details." : 'Add a new supplier to place procurement orders.'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4 flex-1">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Supplier Name *</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`h-10.5 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.name ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500' : ''}`}
                placeholder="e.g. Acme Supplier Co"
              />
              {formErrors.name && <p className="text-rose-500 text-2xs font-bold">{formErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Email Address *</label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`h-10.5 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.email ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500' : ''}`}
                placeholder="e.g. sales@vendor.com"
              />
              {formErrors.email && <p className="text-rose-500 text-2xs font-bold">{formErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Phone Number</label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="h-10.5 rounded-xl border-neutral-200 dark:border-neutral-800"
                placeholder="e.g. +1-555-0100"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="company" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Company / Organization</label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="h-10.5 rounded-xl border-neutral-200 dark:border-neutral-800"
                placeholder="e.g. Apex Wholesales Corp"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Address Details</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full text-xs font-semibold rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Street address, Suite, City, ZIP code..."
              />
            </div>

            <div className="pt-4 flex gap-3 border-t border-neutral-100 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 h-10.5 rounded-xl text-neutral-500 font-bold border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {submitting ? 'Registering...' : (editingSupplier ? 'Save Changes' : 'Register')}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* 5. Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen !== null} onOpenChange={(open) => !open && setIsDeleteConfirmOpen(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">Delete Supplier Profile?</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Are you sure you want to delete this supplier profile? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex flex-row gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(null)}
              className="flex-1 h-10 rounded-xl text-xs font-bold text-neutral-500 border-neutral-200"
            >
              Cancel
            </Button>
            <Button
              onClick={() => isDeleteConfirmOpen && handleDelete(isDeleteConfirmOpen)}
              className="flex-1 h-10 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white dark:bg-rose-500 dark:hover:bg-rose-400"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
