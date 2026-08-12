'use client';

import React, { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ScrollText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info,
  Shield,
  Package,
  ShoppingCart,
  UserCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  module: 'AUTH' | 'INVENTORY' | 'SALES' | 'SYSTEM';
  user: string;
  ip: string;
  action: string;
  details: string;
}

const mockLogs: LogEntry[] = [
  {
    id: 'LOG-8901',
    timestamp: '2026-08-07 14:40:12',
    level: 'SUCCESS',
    module: 'AUTH',
    user: 'Farhat Sarwar (Admin)',
    ip: '192.168.1.45',
    action: 'OTP Verified & Login',
    details: 'User authenticated via 6-digit OTP code.'
  },
  {
    id: 'LOG-8900',
    timestamp: '2026-08-07 14:35:05',
    level: 'INFO',
    module: 'INVENTORY',
    user: 'Sarah Manager',
    ip: '192.168.1.12',
    action: 'Restock Action',
    details: 'Product SKU-4809 (Laptop Pro 16) stock increased by +15 units.'
  },
  {
    id: 'LOG-8899',
    timestamp: '2026-08-07 14:28:44',
    level: 'WARNING',
    module: 'INVENTORY',
    user: 'System Automated',
    ip: 'localhost',
    action: 'Low Stock Triggered',
    details: 'Product SKU-1049 (Wireless Mouse M1) dropped below minStock (4 remaining).'
  },
  {
    id: 'LOG-8898',
    timestamp: '2026-08-07 14:15:30',
    level: 'SUCCESS',
    module: 'SALES',
    user: 'Alice Accountant',
    ip: '192.168.1.88',
    action: 'Order Processed',
    details: 'Order #ORD-2026-101 created ($1,449.00) for TechCorp Solutions.'
  },
  {
    id: 'LOG-8897',
    timestamp: '2026-08-07 13:50:19',
    level: 'ERROR',
    module: 'AUTH',
    user: 'Unknown User',
    ip: '198.51.100.24',
    action: 'Failed Login Attempt',
    details: 'Invalid password credentials submitted for email employee@bizloom.com.'
  },
  {
    id: 'LOG-8896',
    timestamp: '2026-08-07 13:10:00',
    level: 'INFO',
    module: 'SYSTEM',
    user: 'Farhat Sarwar (Admin)',
    ip: '192.168.1.45',
    action: 'Prisma SQLite Migration',
    details: 'Database schema synchronized with SQLite file dev.db.'
  },
  {
    id: 'LOG-8895',
    timestamp: '2026-08-07 12:05:11',
    level: 'SUCCESS',
    module: 'SALES',
    user: 'John Employee',
    ip: '192.168.1.50',
    action: 'Customer Registered',
    details: 'New customer profile "Acme Global Systems" saved into database.'
  }
];

export default function SystemLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.get('/dashboard/logs');
      setLogs(res.data);
    } catch (err: any) {
      if (err.response?.status !== 403) {
        toast.error('Failed to load system logs');
      }
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = 
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
      const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;

      return matchesSearch && matchesLevel && matchesModule;
    });
  }, [searchQuery, selectedLevel, selectedModule, logs]);

  const handleRefresh = async () => {
    await fetchLogs();
    toast.success('System logs refreshed');
  };

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredLogs, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `system_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Logs exported to JSON file');
  };

  const renderLevelBadge = (level: LogEntry['level']) => {
    switch (level) {
      case 'SUCCESS':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            SUCCESS
          </Badge>
        );
      case 'WARNING':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1">
            <AlertTriangle className="h-3 w-3" />
            WARNING
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1">
            <XCircle className="h-3 w-3" />
            ERROR
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1">
            <Info className="h-3 w-3" />
            INFO
          </Badge>
        );
    }
  };

  const renderModuleBadge = (module: LogEntry['module']) => {
    switch (module) {
      case 'AUTH':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Shield className="h-3.5 w-3.5" />
            AUTH
          </span>
        );
      case 'INVENTORY':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Package className="h-3.5 w-3.5" />
            INVENTORY
          </span>
        );
      case 'SALES':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShoppingCart className="h-3.5 w-3.5" />
            SALES
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            <ScrollText className="h-3.5 w-3.5" />
            SYSTEM
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <ScrollText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              System Audit Logs
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Monitor real-time system events, authentication audits, and operational activity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 rounded-xl"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Download className="h-4 w-4" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="rounded-2xl border-neutral-200/80 dark:border-neutral-800">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative w-full max-w-xs" title="Filter this table">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <Input
                  placeholder="Filter this table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-xl border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 text-xs font-semibold text-neutral-600 dark:text-neutral-450"
                />
              </div>

              {/* Level Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-neutral-400 shrink-0" />
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="h-10 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="ALL">All Severity Levels</option>
                  <option value="SUCCESS">Success</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>

              {/* Module Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="h-10 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="ALL">All System Modules</option>
                  <option value="AUTH">Authentication</option>
                  <option value="INVENTORY">Inventory</option>
                  <option value="SALES">Sales & Invoicing</option>
                  <option value="SYSTEM">System Infrastructure</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="rounded-2xl border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-600 dark:text-neutral-300">
                <tr>
                  <th className="px-6 py-3.5">Log ID</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Severity</th>
                  <th className="px-6 py-3.5">Module</th>
                  <th className="px-6 py-3.5">User & IP</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                      Loading logs...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                      No logs found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-neutral-900/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-xs text-neutral-500 dark:text-neutral-400">
                        {log.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-600 dark:text-neutral-400">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4">
                        {renderLevelBadge(log.level)}
                      </td>
                      <td className="px-6 py-4">
                        {renderModuleBadge(log.module)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                          {log.user}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-400">
                          {log.ip}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-800 dark:text-neutral-200">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
