'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface CalendarEvent {
  type: 'invoice' | 'leave' | 'purchase';
  title: string;
  detail: string;
}

interface MiniCalendarWidgetProps {
  events?: Record<string, CalendarEvent[]>;
}

export default function MiniCalendarWidget({ events = {} }: MiniCalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ dateStr: string; items: CalendarEvent[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayEvents(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayEvents(null);
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  return (
    <Card className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col h-full animate-fade-slide-up" style={{ animationDelay: '0.45s' }}>
      <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-indigo-500" />
            Schedule & Events
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400 dark:text-neutral-500">
            Due dates, leaves & deliveries.
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 w-24 text-center">{monthName}</span>
          <button onClick={handleNextMonth} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-neutral-400 dark:text-neutral-500 mb-1">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-8" />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const dayEvents = events[dateStr] || [];

            const hasInvoice = dayEvents.some(e => e.type === 'invoice');
            const hasLeave = dayEvents.some(e => e.type === 'leave');
            const hasPurchase = dayEvents.some(e => e.type === 'purchase');

            return (
              <button
                key={dateStr}
                onClick={() => dayEvents.length > 0 && setSelectedDayEvents({ dateStr, items: dayEvents })}
                className={`relative h-8 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                  isToday
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{day}</span>
                {/* Event indicator dots */}
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {hasInvoice && <span className="h-1 w-1 rounded-full bg-amber-400" />}
                    {hasLeave && <span className="h-1 w-1 rounded-full bg-sky-400" />}
                    {hasPurchase && <span className="h-1 w-1 rounded-full bg-purple-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Popover */}
        {selectedDayEvents && (
          <div className="mt-3 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs relative animate-fade-slide-up">
            <button
              onClick={() => setSelectedDayEvents(null)}
              className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="font-extrabold text-neutral-800 dark:text-neutral-200 mb-1.5">
              Events for {selectedDayEvents.dateStr}:
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {selectedDayEvents.items.map((ev, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    ev.type === 'invoice' ? 'bg-amber-400' : ev.type === 'leave' ? 'bg-sky-400' : 'bg-purple-400'
                  }`} />
                  <span className="font-bold text-neutral-700 dark:text-neutral-300 truncate">{ev.title}</span>
                  <span className="text-neutral-400 truncate">({ev.detail})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Legend & Link */}
        <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2 text-neutral-400 font-semibold">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Invoice</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Leave</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> PO</span>
          </div>
          <Link href="/dashboard/calendar" className="font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5">
            Full View <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
