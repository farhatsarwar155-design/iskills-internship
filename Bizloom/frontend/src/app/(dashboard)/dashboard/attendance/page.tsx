'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  UserCheck,
  CheckCircle
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
}

export default function AttendancePage() {
  const { user } = useAuth();
  
  const [status, setStatus] = useState<{
    checkedIn: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    status?: string;
    employeeId?: string;
  } | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  const fetchStatusAndLogs = async () => {
    setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        api.get('/hr/attendance/today'),
        api.get('/hr/attendance/history')
      ]);
      setStatus(statusRes.data);
      setHistory(historyRes.data.attendance);
    } catch (err) {
      console.error('Failed to load attendance logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndLogs();
  }, []);

  const handleCheckIn = async () => {
    setActioning(true);
    try {
      const response = await api.post('/hr/attendance/checkin');
      toast.success(response.data.message || 'Checked in successfully!');
      fetchStatusAndLogs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActioning(false);
    }
  };

  const handleCheckOut = async () => {
    setActioning(true);
    try {
      const response = await api.post('/hr/attendance/checkout');
      toast.success(response.data.message || 'Checked out successfully!');
      fetchStatusAndLogs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActioning(false);
    }
  };

  const formatHours = (checkInStr: string, checkOutStr: string | null) => {
    if (!checkOutStr) return 'Active Shift';
    const inTime = new Date(checkInStr);
    const outTime = new Date(checkOutStr);
    const diffMs = outTime.getTime() - inTime.getTime();
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Attendance Tracking</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Record check-in and check-out logs for daily work shift logging.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Portal Button Panel */}
        <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm p-6 flex flex-col justify-between min-h-[300px] lg:col-span-1">
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Shift Terminal
            </h2>
            <p className="text-xs text-neutral-500">Record check-in when beginning work shift and check-out when completing work.</p>
            
            {status && status.checkInTime && (
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Logged In</span>
                  <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">{new Date(status.checkInTime).toLocaleTimeString()}</span>
                </div>
                {status.checkOutTime && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Logged Out</span>
                    <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">{new Date(status.checkOutTime).toLocaleTimeString()}</span>
                  </div>
                )}
                {status.status && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Terminal Status</span>
                    <span className={`font-bold text-[10px] uppercase ${status.status === 'LATE' ? 'text-amber-600' : 'text-emerald-650'}`}>{status.status}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-6">
            {loading ? (
              <div className="h-12 w-full rounded-xl bg-neutral-100 animate-pulse" />
            ) : !status || (!status.checkInTime) ? (
              <Button
                onClick={handleCheckIn}
                disabled={actioning}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <LogIn className="h-5 w-5" /> Check In
              </Button>
            ) : status.checkInTime && !status.checkOutTime ? (
              <Button
                onClick={handleCheckOut}
                disabled={actioning}
                className="w-full h-12 rounded-xl bg-amber-650 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <LogOut className="h-5 w-5" /> Check Out
              </Button>
            ) : (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-705 dark:text-emerald-400 rounded-xl text-center flex items-center justify-center gap-1.5 text-xs font-bold border border-emerald-200/50">
                <CheckCircle className="h-4 w-4" /> Shift completed for today!
              </div>
            )}
          </div>
        </Card>

        {/* History Table */}
        <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800/50">
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-850 dark:text-white flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> Shift History Logs
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900/30 text-xs font-bold text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">In Time</th>
                  <th className="p-4">Out Time</th>
                  <th className="p-4">Work Duration</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-4"><div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                      <td className="p-4"><div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                      <td className="p-4"><div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                      <td className="p-4"><div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                      <td className="p-4"><div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    </tr>
                  ))
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-neutral-400">No shift history found. Check in above to create logs.</td>
                  </tr>
                ) : (
                  history.map(record => (
                    <tr key={record.id}>
                      <td className="p-4 font-semibold text-neutral-850 dark:text-neutral-200">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="p-4 font-mono text-neutral-500">{new Date(record.checkIn).toLocaleTimeString()}</td>
                      <td className="p-4 font-mono text-neutral-500">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '--:--:--'}</td>
                      <td className="p-4 text-neutral-500 font-semibold">{formatHours(record.checkIn, record.checkOut)}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
