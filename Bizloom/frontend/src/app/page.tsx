'use client';

import React from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import StatsBar from '@/components/landing/StatsBar';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import ModulesShowcase from '@/components/landing/ModulesShowcase';
import AIHighlight from '@/components/landing/AIHighlight';
import Testimonials from '@/components/landing/Testimonials';
import CTABanner from '@/components/landing/CTABanner';
import Footer from '@/components/landing/Footer';

export default function RootPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 font-sans selection:bg-indigo-500/30">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <FeaturesGrid />
      <ModulesShowcase />
      <AIHighlight />
      <Testimonials />
      <CTABanner />
      <Footer />
    </main>
  );
}
