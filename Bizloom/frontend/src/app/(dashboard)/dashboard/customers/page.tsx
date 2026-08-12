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
  UserCheck,
  Briefcase,
  Users,
  FileDown,
  ChevronDown
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  company: string | null;
  createdAt: string;
}

export default function CustomersPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Modal / Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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

  // Fetch customers list
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales/customers', {
        params: { search: debouncedSearch }
      });
      setCustomers(response.data.customers);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch]);

  // Open Add drawer when navigated with ?openDrawer=true
  useEffect(() => {
    if (searchParams.get('openDrawer') === 'true') {
      handleOpenCreate();
    }
  }, [searchParams]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company'];
    const rows = customers.map((c) => [
      c.name,
      c.email,
      c.phone || '',
      c.company || '',
    ]);
    exportToCSV(headers, rows, `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ['Name', 'Email', 'Company'];
    const rows = customers.map((c) => [
      c.name,
      c.email,
      c.company || '',
    ]);
    exportToPDF('Customers Report', headers, rows, `customers_export_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Open drawer for creating
  const handleOpenCreate = () => {
    setEditingCustomer(null);
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
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      address: customer.address || ''
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
      if (editingCustomer) {
        // Edit Customer
        await api.put(`/sales/customers/${editingCustomer.id}`, formData);
        toast.success('Customer details updated');
      } else {
        // Create Customer
        await api.post('/sales/customers', formData);
        toast.success('Customer registered successfully');
      }
      setIsDrawerOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error processing request');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Customer Action
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/sales/customers/${id}`);
      toast.success('Customer profile deleted');
      setIsDeleteConfirmOpen(null);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not delete customer');
      setIsDeleteConfirmOpen(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Customers</h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Audit customer directories, edit billing details, and manage associations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export dropdown */}
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
              onClick={handleOpenCreate}
              className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Plus className="h-5 w-5" />
              Add Customer
            </Button>
          )}
        </div>
      </div>

      {/* 2. Search filter */}
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900/90 shadow-sm p-4">
        <div className="relative max-w-xs" title="Filter this table">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
          <Input
            type="text"
            placeholder="Filter this table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl border-neutral-200 bg-slate-50/50 dark:border-neutral-800 focus:bg-white transition-all text-xs font-semibold text-neutral-600 dark:text-neutral-450"
          />
        </div>
      </Card>

      {/* 3. Cards Grid */}
      {loading ? (
        // Skeletons loader Grid
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <Card key={idx} className="rounded-2xl border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 animate-pulse">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  <div className="h-3 w-40 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : customers.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/70 rounded-2xl text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mb-4">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-neutral-800 dark:text-white">No customers found</h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
            Add a customer profile to associate with new sales orders and invoices.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((cust) => {
            const initials = cust.name.split(' ').map(n => n[0]).join('');

            return (
              <Card
                key={cust.id}
                className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 hover:shadow-md hover:scale-[1.01] transition-all duration-200 overflow-hidden relative group"
              >
                <CardContent className="p-5 flex items-start gap-4 h-full">
                  <Avatar className="h-12 w-12 border border-neutral-100 dark:border-neutral-800 shrink-0">
                    <AvatarFallback className="bg-indigo-50 text-indigo-700 dark:bg-neutral-850 dark:text-indigo-400 font-extrabold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 space-y-2 text-xs">
                    <div>
                      <h4 className="font-extrabold text-sm text-neutral-800 dark:text-white truncate">{cust.name}</h4>
                      {cust.company && (
                        <div className="flex items-center gap-1 mt-0.5 text-neutral-500 dark:text-neutral-400 font-medium">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{cust.company}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Mail className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                      {cust.phone && (
                        <div className="flex items-center gap-1.5 font-medium">
                          <Phone className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                      {cust.address && (
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate">{cust.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions layer */}
                  {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user?.role || '') && (
                    <div className="absolute right-3 top-3 flex gap-1 bg-white/95 dark:bg-neutral-900/95 p-1 rounded-lg border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(cust)}
                        className="h-7 w-7 text-neutral-600 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-md"
                        title="Edit Customer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsDeleteConfirmOpen(cust.id)}
                        className="h-7 w-7 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md"
                        title="Delete Customer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 4. Add/Edit Customer Drawer (Sheet) */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-850 p-6 flex flex-col h-full overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <SheetTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </SheetTitle>
            <SheetDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              {editingCustomer ? 'Update this customer profile information.' : 'Register a new customer account.'}
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4 flex-1">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Full Name *</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.name ? 'border-rose-500' : ''}`}
                placeholder="e.g. Charles Xavier"
              />
              {formErrors.name && <span className="text-[10px] text-rose-500 font-semibold">{formErrors.name}</span>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Email Address *</label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.email ? 'border-rose-500' : ''}`}
                placeholder="e.g. charles@xavier.edu"
              />
              {formErrors.email && <span className="text-[10px] text-rose-500 font-semibold">{formErrors.email}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Phone number</label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800"
                  placeholder="+1-555-xxxx"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="company" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Company name</label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="h-10 rounded-xl border-neutral-200 dark:border-neutral-800"
                  placeholder="Xavier Academy"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Street Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full min-h-[80px] p-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                placeholder="1407 Graymalkin Lane, Westchester County, NY"
              />
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 h-10.5 rounded-xl text-neutral-500 border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {submitting ? 'Processing...' : 'Save Customer'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* 5. Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen !== null} onOpenChange={(open) => !open && setIsDeleteConfirmOpen(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5.5 w-5.5 text-rose-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Are you sure you want to delete this customer? This action cannot be undone and will fail if the customer is associated with existing orders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(null)} className="flex-1 h-9.5 text-xs rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => isDeleteConfirmOpen && handleDelete(isDeleteConfirmOpen)}
              className="flex-1 h-9.5 text-xs rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
