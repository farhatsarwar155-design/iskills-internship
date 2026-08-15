'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import FadeIn from './FadeIn';
import { useAuth } from '@/context/AuthContext';

export default function CTABanner() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-24 bg-white dark:bg-neutral-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="relative rounded-3xl overflow-hidden bg-indigo-600 px-8 py-16 md:px-16 text-center shadow-2xl">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">
                Ready to streamline your business?
              </h2>
              <p className="text-indigo-100 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10">
                Join 500+ businesses using Bizloom to consolidate their operations, empower their teams, and grow revenue.
              </p>
              
              <Link href="/register">
                <Button className="h-14 px-10 rounded-2xl bg-white text-indigo-600 hover:bg-neutral-50 font-black text-lg shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
