'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  Plus,
  Search,
  Mail,
  Phone,
  Briefcase,
  Users,
  Calendar,
  Building,
  UserCheck,
  DollarSign,
  FileDown,
  ChevronDown
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  department: string;
  salary: number;
  status: 'ACTIVE' | 'INACTIVE';
  hireDate: string;
}

export default function HRDirectoryPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [deptFilter, setDeptFilter] = useState('all');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Drawer status
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    status: 'ACTIVE'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Departments list for filter
  const departments = ['Engineering', 'Product', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations'];

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get('/hr/employees', {
        params: { search: debouncedSearch, department: deptFilter }
      });
      setEmployees(response.data.employees);
    } catch (err) {
      toast.error('Failed to load employee directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [debouncedSearch, deptFilter]);

  // Open Add drawer when navigated with ?openDrawer=true
  useEffect(() => {
    if (searchParams.get('openDrawer') === 'true') {
      setIsDrawerOpen(true);
    }
  }, [searchParams]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      department: 'Engineering',
      salary: '',
      status: 'ACTIVE'
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.position.trim()) errors.position = 'Job position is required';
    if (!formData.department) errors.department = 'Department is required';
    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      errors.salary = 'Please enter a valid positive salary amount';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await api.post('/hr/employees', formData);
      toast.success('Employee registered successfully');
      setIsDrawerOpen(false);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register employee');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Position', 'Department', 'Email', 'Salary', 'Status'];
    const rows = employees.map(e => [
      e.name,
      e.position,
      e.department,
      e.email,
      e.salary.toFixed(2),
      e.status
    ]);
    exportToCSV(headers, rows, `employees_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportPDF = () => {
    const headers = ['Name', 'Position', 'Department', 'Status'];
    const rows = employees.map(e => [
      e.name,
      e.position,
      e.department,
      e.status
    ]);
    exportToPDF('Employee Directory', headers, rows, `employees_export_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Employee Directory</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">View roster cards, record attendance check-ins, and prepare monthly payroll payslips.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
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

          {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
            <Button
              onClick={handleOpenCreate}
              className="h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-bold flex items-center gap-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Plus className="h-5 w-5" />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* 2. Search & Filter panel */}
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
            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Department</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* 3. Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse border border-neutral-200/50 dark:border-neutral-800/70">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-805" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-805 rounded" />
                    <div className="h-3 w-1/3 bg-neutral-200 dark:bg-neutral-805 rounded" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
                  <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-805 rounded" />
                  <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-805 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-16 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mb-4">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-neutral-850 dark:text-white">No employees registered</h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
              Add members to your team to monitor attendance and run monthly salary payrolls.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(employee => (
            <Link key={employee.id} href={`/dashboard/hr/${employee.id}`} className="block group">
              <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/55 transition-all overflow-hidden h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 rounded-full border border-indigo-100 dark:border-indigo-950 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                        <AvatarFallback className="font-bold text-xs">{getInitials(employee.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{employee.name}</h3>
                        <p className="text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <Briefcase className="h-3 w-3" />
                          {employee.position}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                      employee.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                      {employee.status}
                    </span>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800/50 text-xs text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{employee.department} Department</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    {employee.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      <span>Hired: {new Date(employee.hireDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* 4. Add Employee Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-855 p-6 flex flex-col h-full overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-805">
            <SheetTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Register Employee</SheetTitle>
            <SheetDescription className="text-xs text-neutral-500 dark:text-neutral-400">Create a new HR profile in the corporate roster database.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4 flex-1">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Full Name *</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`h-10.5 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.name ? 'border-rose-500 dark:border-rose-500' : ''}`}
                placeholder="e.g. Alexis Carter"
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
                className={`h-10.5 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.email ? 'border-rose-500 dark:border-rose-500' : ''}`}
                placeholder="e.g. alexis@company.com"
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
                placeholder="e.g. 555-0190"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="position" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Position *</label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.position ? 'border-rose-500 dark:border-rose-500' : ''}`}
                  placeholder="e.g. Designer"
                />
                {formErrors.position && <p className="text-rose-500 text-2xs font-bold">{formErrors.position}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="department" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Department *</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="salary" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Monthly Base ($) *</label>
                  {user?.role !== 'ADMIN' && <span className="text-[9px] text-rose-500 font-bold uppercase">Admin Only</span>}
                </div>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  value={user?.role !== 'ADMIN' ? '' : formData.salary}
                  onChange={handleInputChange}
                  className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${formErrors.salary ? 'border-rose-500 dark:border-rose-500' : ''}`}
                  placeholder={user?.role !== 'ADMIN' ? "••••••••" : "e.g. 5000"}
                  disabled={user?.role !== 'ADMIN'}
                />
                {formErrors.salary && <p className="text-rose-500 text-2xs font-bold">{formErrors.salary}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="status" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 focus:outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
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
                {submitting ? 'Registering...' : 'Register'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
