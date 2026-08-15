'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Hexagon, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm group-hover:scale-105 transition-transform">
              <Hexagon className="h-5 w-5" />
            </div>
            <span className={`text-xl font-black tracking-tight ${scrolled ? 'text-neutral-900 dark:text-white' : 'text-neutral-900 dark:text-white'}`}>
              Bizloom
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-neutral-600 dark:text-neutral-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
            <a href="#modules" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Modules</a>
            <a href="#ai" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">AI Intelligence</a>
            <a href="#about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="h-10 px-5 rounded-xl border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold cursor-pointer">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm hover:shadow-md transition-all cursor-pointer">
                Register
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-4 pt-2 pb-6 space-y-4 shadow-lg absolute w-full left-0 top-full">
          <div className="flex flex-col space-y-3 font-bold text-neutral-700 dark:text-neutral-200">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900">Features</a>
            <a href="#modules" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900">Modules</a>
            <a href="#ai" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900">AI Intelligence</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900">About</a>
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full h-10 rounded-xl font-bold cursor-pointer">Login</Button>
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full h-10 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer">Register</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
