'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading skeleton screen while resolving auth status
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo / spinner skeleton */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute h-12 w-12 animate-ping rounded-full bg-indigo-600/20 dark:bg-indigo-500/20" />
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent dark:border-indigo-500" />
        </div>
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">Loading Business ERP...</span>
      </div>
    </div>
  );
}
