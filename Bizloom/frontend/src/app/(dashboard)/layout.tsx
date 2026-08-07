'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen bg-slate-50 dark:bg-neutral-950 font-sans">
        {/* Sidebar skeleton */}
        <div className="hidden w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 md:block p-4 space-y-4">
          <div className="h-8 w-32 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
          <div className="space-y-3 pt-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Header skeleton */}
          <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between px-6">
            <div className="h-8 w-48 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            </div>
          </div>
          {/* Page body skeleton */}
          <div className="flex-1 p-6 space-y-6">
            <div className="h-6 w-32 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="h-80 rounded-2xl bg-neutral-200 dark:bg-neutral-800 lg:col-span-2 animate-pulse" />
              <div className="h-80 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect shortly via useEffect
  }

  return <AppShell>{children}</AppShell>;
}
