'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles, Filter, AlertTriangle, UserCheck, Truck, ShoppingCart } from 'lucide-react';
import api from '@/lib/api';

interface CalendarEvent {
  id: string;
  type: 'invoice' | 'leave' | 'purchase';
  dateStr: string;
  title: string;
  detail: string;
  amount?: number;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/dashboard/widgets');
        const calEvents = res.data?.calendarEvents || {};
        
        // Transform into structured list
        const structured: Record<string, CalendarEvent[]> = {};
        Object.entries(calEvents).forEach(([dateStr, items]: [string, any]) => {
          structured[dateStr] = items.map((item: any, idx: number) => ({
            id: `${dateStr}-${idx}`,
            type: item.type,
            dateStr,
            title: item.title,
            detail: item.detail,
          }));
        });
        setEvents(structured);
      } catch (err) {
        console.error('Failed to load calendar events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().split('T')[0];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              Operational Calendar
            </h1>
            <span className="flex h-6 items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider">
              <CalendarDays className="h-3 w-3" />
              Schedule & Events
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-semibold">
            Track upcoming invoice due dates, employee leave requests, and purchase order deliveries.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-400" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="h-10 text-xs px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-bold shadow-xs"
          >
            <option value="all">All Event Types</option>
            <option value="invoice">Invoices Only (Yellow)</option>
            <option value="leave">Leaves Only (Blue)</option>
            <option value="purchase">Deliveries Only (Purple)</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm">
          <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-500" />
              {monthName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 text-xs font-extrabold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-neutral-400 dark:text-neutral-500 mb-2">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="h-16 rounded-xl border border-transparent" />;

                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                let dayEvents = events[dateStr] || [];

                if (filterType !== 'all') {
                  dayEvents = dayEvents.filter(e => e.type === filterType);
                }

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-16 p-1.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20'
                        : isToday
                        ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 font-black'
                        : 'border-neutral-100 dark:border-neutral-800/80 bg-slate-50/30 dark:bg-neutral-900/30 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <span className={`text-xs font-extrabold ${isToday ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-neutral-800 dark:text-neutral-200'}`}>
                      {day}
                    </span>

                    {/* Event indicators */}
                    <div className="space-y-0.5 max-h-9 overflow-hidden">
                      {dayEvents.slice(0, 2).map((e, i) => (
                        <div
                          key={i}
                          className={`text-[9px] font-extrabold px-1 rounded truncate flex items-center gap-1 ${
                            e.type === 'invoice'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                              : e.type === 'leave'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
                          }`}
                        >
                          <span className="truncate">{e.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[8px] font-bold text-neutral-400 block pl-0.5">+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details Sidebar */}
        <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/50">
            <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
              {selectedDate ? `Events for ${selectedDate}` : 'Date Agenda'}
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">
              Click any calendar day to inspect schedule items.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 space-y-3">
            {!selectedDate || !events[selectedDate] || events[selectedDate].length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center text-neutral-400 space-y-2">
                <CalendarDays className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                <p className="text-xs font-semibold">No operational events scheduled on this date.</p>
              </div>
            ) : (
              events[selectedDate].map((e, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border space-y-1 ${
                    e.type === 'invoice'
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30'
                      : e.type === 'leave'
                      ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200/60 dark:border-sky-900/30'
                      : 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      {e.type === 'invoice' && <ShoppingCart className="h-3.5 w-3.5 text-amber-500" />}
                      {e.type === 'leave' && <UserCheck className="h-3.5 w-3.5 text-sky-500" />}
                      {e.type === 'purchase' && <Truck className="h-3.5 w-3.5 text-purple-500" />}
                      {e.title}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium pl-5">{e.detail}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
