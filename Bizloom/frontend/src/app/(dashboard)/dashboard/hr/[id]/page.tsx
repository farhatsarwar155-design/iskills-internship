'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Building,
  DollarSign,
  AlertTriangle,
  Clock,
  Printer,
  FileDown,
  User,
  History,
  Calculator,
  ChevronLeft,
  Edit2,
  Trash2
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
}

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
  attendance: AttendanceRecord[];
}

interface Payslip {
  employee: {
    name: string;
    email: string;
    position: string;
    department: string;
  };
  payPeriod: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  notes: string;
  generatedAt: string;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'payroll'>('info');

  // Edit / Delete states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Form Fields
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    status: 'ACTIVE'
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Payroll Calculator Fields
  const [bonuses, setBonuses] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [payrollNotes, setPayrollNotes] = useState('');
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/hr/employees/${id}`);
      setEmployee(response.data.employee);
      
      const emp = response.data.employee;
      setEditData({
        name: emp.name,
        email: emp.email,
        phone: emp.phone || '',
        position: emp.position,
        department: emp.department,
        salary: String(emp.salary),
        status: emp.status
      });
    } catch (err) {
      toast.error('Failed to load employee details');
      router.push('/dashboard/hr');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEmployee();
  }, [id]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    if (!editData.name.trim()) errors.name = 'Full name is required';
    if (!editData.email.trim()) errors.email = 'Email address is required';
    if (!editData.position.trim()) errors.position = 'Position is required';
    if (!editData.salary || parseFloat(editData.salary) <= 0) errors.salary = 'Enter a positive base salary';
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    setSubmitting(true);
    try {
      await api.put(`/hr/employees/${id}`, editData);
      toast.success('Employee profile updated');
      setIsEditOpen(false);
      fetchEmployee();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/hr/employees/${id}`);
      toast.success('Employee record deleted');
      setIsDeleteOpen(false);
      router.push('/dashboard/hr');
    } catch (err) {
      toast.error('Failed to delete employee profile');
    }
  };

  const handleCalculatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingPayroll(true);
    try {
      const response = await api.post('/hr/payroll/payslip', {
        employeeId: id,
        bonuses: parseFloat(bonuses) || 0,
        deductions: parseFloat(deductions) || 0,
        notes: payrollNotes
      });
      setPayslip(response.data.payslip);
      toast.success('Payslip calculated and transaction recorded!');
    } catch (err) {
      toast.error('Failed to calculate payroll');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  if (loading || !employee) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-neutral-200 dark:bg-neutral-850 rounded-2xl" />
        <div className="h-64 bg-neutral-200 dark:bg-neutral-850 rounded-2xl" />
      </div>
    );
  }

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
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/hr')}
        className="h-8 -ml-2 text-xs font-semibold text-neutral-500 hover:text-indigo-600 flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" /> Back to HR Directory
      </Button>

      {/* Header Info */}
      <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 rounded-full border border-indigo-100 dark:border-indigo-950 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <AvatarFallback className="font-bold text-sm">{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">{employee.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-2xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {employee.position}
                </span>
                <span className="text-neutral-300 dark:text-neutral-800">•</span>
                <span className="text-2xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                  <Building className="h-3 w-3" /> {employee.department}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-bold border ${
              employee.status === 'ACTIVE' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
            }`}>
              {employee.status}
            </span>

            {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(true)}
                  className="h-9 rounded-xl px-3.5 text-xs font-bold border-neutral-250 flex items-center gap-1.5"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteOpen(true)}
                  className="h-9 rounded-xl px-3.5 text-xs font-bold border-rose-250 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/15"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs list */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 flex gap-6 text-xs font-bold text-neutral-400 dark:text-neutral-500">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 flex items-center gap-1.5 transition-all ${activeTab === 'info' ? 'border-b-2 border-indigo-650 text-indigo-650 dark:text-indigo-400' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
        >
          <User className="h-4 w-4" /> Personal Info
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 flex items-center gap-1.5 transition-all ${activeTab === 'attendance' ? 'border-b-2 border-indigo-650 text-indigo-650 dark:text-indigo-400' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
        >
          <History className="h-4 w-4" /> Attendance Logs
        </button>
        {['ADMIN', 'ACCOUNTANT'].includes(user?.role || '') && (
          <button
            onClick={() => setActiveTab('payroll')}
            className={`pb-3 flex items-center gap-1.5 transition-all ${activeTab === 'payroll' ? 'border-b-2 border-indigo-650 text-indigo-650 dark:text-indigo-400' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
          >
            <Calculator className="h-4 w-4" /> Run Payroll
          </button>
        )}
      </div>

      {/* Content panes */}
      <div className="space-y-6">
        {/* TAB 1: PERSONAL INFO */}
        {activeTab === 'info' && (
          <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-850 dark:text-white mb-4">Contract & Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1 bg-slate-50/50 dark:bg-neutral-950/20 p-3.5 rounded-xl border">
                <span className="font-bold text-neutral-400 uppercase tracking-widest text-3xs">Email Address</span>
                <p className="font-bold text-neutral-850 dark:text-neutral-250 flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-neutral-400" /> {employee.email}
                </p>
              </div>
              
              <div className="space-y-1 bg-slate-50/50 dark:bg-neutral-950/20 p-3.5 rounded-xl border">
                <span className="font-bold text-neutral-400 uppercase tracking-widest text-3xs">Phone Contact</span>
                <p className="font-bold text-neutral-850 dark:text-neutral-250 flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-neutral-400" /> {employee.phone || 'N/A'}
                </p>
              </div>

              <div className="space-y-1 bg-slate-50/50 dark:bg-neutral-950/20 p-3.5 rounded-xl border">
                <span className="font-bold text-neutral-400 uppercase tracking-widest text-3xs">Monthly Base Salary</span>
                <p className="font-bold text-neutral-850 dark:text-neutral-250 flex items-center gap-2 mt-1">
                  <DollarSign className="h-4 w-4 text-neutral-400" /> ${employee.salary.toLocaleString()} / month
                </p>
              </div>

              <div className="space-y-1 bg-slate-50/50 dark:bg-neutral-950/20 p-3.5 rounded-xl border">
                <span className="font-bold text-neutral-400 uppercase tracking-widest text-3xs">Date of Hire</span>
                <p className="font-bold text-neutral-850 dark:text-neutral-250 flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-neutral-400" /> {new Date(employee.hireDate).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-1 bg-slate-50/50 dark:bg-neutral-950/20 p-3.5 rounded-xl border">
                <span className="font-bold text-neutral-400 uppercase tracking-widest text-3xs">Assigned Department</span>
                <p className="font-bold text-neutral-850 dark:text-neutral-250 flex items-center gap-2 mt-1">
                  <Building className="h-4 w-4 text-neutral-400" /> {employee.department} Division
                </p>
              </div>

              <div className="space-y-1 bg-slate-50/50 dark:bg-neutral-950/20 p-3.5 rounded-xl border">
                <span className="font-bold text-neutral-400 uppercase tracking-widest text-3xs">Role Title</span>
                <p className="font-bold text-neutral-850 dark:text-neutral-250 flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4 text-neutral-400" /> {employee.position}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* TAB 2: ATTENDANCE HISTORY */}
        {activeTab === 'attendance' && (
          <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800/50">
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-850 dark:text-white">Recent Attendance Logs</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900/30 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                    <th className="p-4">Date</th>
                    <th className="p-4">Check In</th>
                    <th className="p-4">Check Out</th>
                    <th className="p-4">Total Time</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {employee.attendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-neutral-400">No attendance check-ins recorded for this employee.</td>
                    </tr>
                  ) : (
                    employee.attendance.map(record => {
                      const inTime = new Date(record.checkIn);
                      const outTime = record.checkOut ? new Date(record.checkOut) : null;
                      
                      let diffHours = '';
                      if (outTime) {
                        const diffMs = outTime.getTime() - inTime.getTime();
                        const diffHrs = Math.floor(diffMs / 3600000);
                        const diffMins = Math.floor((diffMs % 3600000) / 60000);
                        diffHours = `${diffHrs}h ${diffMins}m`;
                      } else {
                        diffHours = 'Active Session';
                      }

                      return (
                        <tr key={record.id}>
                          <td className="p-4 font-semibold text-neutral-850 dark:text-neutral-200">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="p-4 font-mono text-neutral-500">{inTime.toLocaleTimeString()}</td>
                          <td className="p-4 font-mono text-neutral-500">{outTime ? outTime.toLocaleTimeString() : '--:--:--'}</td>
                          <td className="p-4 text-neutral-500 font-semibold">{diffHours}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                              record.status === 'PRESENT' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                : record.status === 'LATE' 
                                ? 'bg-amber-50 text-amber-705 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400'
                                : 'bg-rose-50 text-rose-700 border-rose-200/50'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: RUN PAYROLL */}
        {activeTab === 'payroll' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payroll calculation form */}
            <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm p-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-850 dark:text-white mb-4">Salary Payslip Calculator</h2>
              <form onSubmit={handleCalculatePayroll} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1 bg-slate-50 dark:bg-neutral-950/20 p-3 rounded-xl border">
                  <span className="font-bold text-neutral-400 uppercase tracking-widest text-3xs">Base Monthly Salary</span>
                  <p className="font-bold text-sm text-neutral-900 dark:text-white mt-1">${employee.salary.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-700 dark:text-neutral-300">Add Bonuses ($)</label>
                    <Input
                      type="number"
                      value={bonuses}
                      onChange={(e) => setBonuses(e.target.value)}
                      placeholder="0"
                      className="h-10.5 rounded-xl border-neutral-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-700 dark:text-neutral-300">Deductions ($)</label>
                    <Input
                      type="number"
                      value={deductions}
                      onChange={(e) => setDeductions(e.target.value)}
                      placeholder="0"
                      className="h-10.5 rounded-xl border-neutral-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-700 dark:text-neutral-300">Payslip Notes / Remarks</label>
                  <textarea
                    value={payrollNotes}
                    onChange={(e) => setPayrollNotes(e.target.value)}
                    rows={2}
                    placeholder="Bonus details, performance award note..."
                    className="w-full text-xs font-semibold rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={generatingPayroll}
                  className="w-full h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  {generatingPayroll ? 'Generating Payslip...' : 'Generate & Record Payslip'}
                </Button>
              </form>
            </Card>

            {/* Payslip View Panel */}
            <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden flex flex-col justify-between">
              {payslip ? (
                <>
                  <div id="printable-invoice" className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-black tracking-tight text-neutral-900 dark:text-white uppercase">Bizloom Payroll</h3>
                        <p className="text-3xs text-neutral-500 dark:text-neutral-400">Salary Payslip Statement</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">Pay Period</span>
                        <h4 className="text-xs font-bold text-neutral-850 dark:text-neutral-200 mt-0.5">{payslip.payPeriod}</h4>
                      </div>
                    </div>

                    <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                    <div className="text-2xs space-y-1">
                      <span className="font-bold text-neutral-400 uppercase tracking-widest text-3xs">Employee Details:</span>
                      <h4 className="font-black text-xs text-neutral-900 dark:text-white">{payslip.employee.name}</h4>
                      <p className="text-neutral-500">{payslip.employee.position} — {payslip.employee.department} Dept</p>
                      <p className="text-neutral-500">{payslip.employee.email}</p>
                    </div>

                    <table className="w-full text-left border-collapse text-2xs">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          <th className="py-2">Earnings & Deductions</th>
                          <th className="py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850 font-semibold">
                        <tr>
                          <td className="py-2">Base Salary</td>
                          <td className="py-2 text-right text-neutral-900 dark:text-white">${payslip.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                        {payslip.bonuses > 0 && (
                          <tr>
                            <td className="py-2 text-emerald-600">Bonuses / Additions</td>
                            <td className="py-2 text-right text-emerald-650 dark:text-emerald-400">+${payslip.bonuses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </tr>
                        )}
                        {payslip.deductions > 0 && (
                          <tr>
                            <td className="py-2 text-rose-600">Deductions / Taxes</td>
                            <td className="py-2 text-right text-rose-655 dark:text-rose-450">-${payslip.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="border-t pt-4 flex justify-between items-start text-xs">
                      <div className="text-3xs text-neutral-400 max-w-xs leading-relaxed">
                        <span className="font-bold uppercase tracking-wider block mb-0.5">Notes:</span>
                        {payslip.notes}
                      </div>
                      <div className="text-right w-40">
                        <span className="text-3xs font-black uppercase text-neutral-400">Net Salary Payout</span>
                        <h4 className="text-sm font-black text-neutral-900 dark:text-white mt-1">${payslip.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-neutral-850 border-t flex justify-end gap-2.5 print-hide">
                    <Button
                      onClick={() => {
                        const printArea = document.getElementById('printable-invoice');
                        if (printArea) {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write('<html><head><title>Payslip ' + employee.name + '</title>');
                            printWindow.document.write('<style>body{font-family:system-ui,sans-serif;padding:40px;color:#111}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;text-align:left;font-size:12px}th{background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;color:#64748b}td{border-bottom:1px solid #f1f5f9}.text-right{text-align:right}.font-bold{font-weight:700}.font-mono{font-family:monospace}.text-emerald-600{color:#16a34a}.text-rose-600{color:#dc2626}</style>');
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
                      <FileDown className="h-4 w-4" /> Download PDF
                    </Button>
                    <Button onClick={handlePrintPayslip} className="h-9.5 text-xs rounded-xl px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                      <Printer className="h-4 w-4" /> Print Payslip
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mb-4">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <h3 className="text-xs font-bold text-neutral-850 dark:text-white">Ready to calculate</h3>
                  <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                    Fill out the payroll adjustments form to generate a previewable and printable salary payslip.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Edit Employee Drawer (Admin/Manager) */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-855 p-6 flex flex-col h-full overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-805">
            <SheetTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Edit HR Profile</SheetTitle>
            <SheetDescription className="text-xs text-neutral-500 dark:text-neutral-400">Modify professional details or contract terms.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleUpdate} className="space-y-4 py-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Full Name *</label>
              <Input
                name="name"
                value={editData.name}
                onChange={handleEditChange}
                className={`h-10.5 rounded-xl border-neutral-200 dark:border-neutral-800 ${editErrors.name ? 'border-rose-500' : ''}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Email Address *</label>
              <Input
                name="email"
                type="email"
                value={editData.email}
                onChange={handleEditChange}
                className={`h-10.5 rounded-xl border-neutral-200 dark:border-neutral-800 ${editErrors.email ? 'border-rose-500' : ''}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Phone Contact</label>
              <Input
                name="phone"
                value={editData.phone}
                onChange={handleEditChange}
                className="h-10.5 rounded-xl border-neutral-200 dark:border-neutral-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Position *</label>
                <Input
                  name="position"
                  value={editData.position}
                  onChange={handleEditChange}
                  className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${editErrors.position ? 'border-rose-500' : ''}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Department</label>
                <select
                  name="department"
                  value={editData.department}
                  onChange={handleEditChange}
                  className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Monthly Base ($) *</label>
                <Input
                  name="salary"
                  type="number"
                  value={editData.salary}
                  onChange={handleEditChange}
                  className={`h-10 rounded-xl border-neutral-200 dark:border-neutral-800 ${editErrors.salary ? 'border-rose-500' : ''}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Status</label>
                <select
                  name="status"
                  value={editData.status}
                  onChange={handleEditChange}
                  className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-neutral-100">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1 h-10.5 rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold dark:bg-indigo-500 dark:hover:bg-indigo-400">
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 shadow-xl">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold">Delete Employee Profile?</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 mt-1">
              Confirm deleting this employee roster record. This operation is permanent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-row gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="flex-1 h-10 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleDelete} className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white">
              Delete Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
