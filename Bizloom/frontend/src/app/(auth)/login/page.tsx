'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return null; // Let root redirect handle it
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50 dark:bg-neutral-950 font-sans">
      {/* Left side: Premium brand gradient illustration */}
      <div className="relative hidden w-1/2 items-center justify-center bg-neutral-900 lg:flex overflow-hidden">
        {/* Glow gradients */}
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-600/35 blur-[120px] dark:bg-indigo-500/20" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-teal-500/20 blur-[100px]" />
        
        {/* Abstract grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        <div className="relative z-10 max-w-lg px-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-100">
              Bizloom
            </span>
          </div>
          
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-4">
            Simplify Your Enterprise Operations with ERP Lite.
          </h1>
          <p className="text-lg text-neutral-300 font-medium mb-8 leading-relaxed">
            Manage inventory, sales trends, staff permissions, and finance records on a clean, premium, and unified dashboard designed for modern business operations.
          </p>

          {/* Feature list badges */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-200 backdrop-blur-md">
              ✦ Role-based Middleware
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-200 backdrop-blur-md">
              ✦ Refresh Token Rotation
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-200 backdrop-blur-md">
              ✦ Analytics Charts
            </span>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="absolute bottom-6 left-8 text-xs text-neutral-500">
          © 2026 Bizloom, Inc. All rights reserved.
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-neutral-900 border-l border-neutral-200/50 dark:border-neutral-800/50">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight dark:text-white">Bizloom</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              New to Bizloom?{' '}
              <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <Card className="border-0 shadow-none bg-transparent">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold leading-6 text-neutral-800 dark:text-neutral-200">
                    Email address
                  </label>
                  <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-600 focus-visible:ring-2 focus-visible:border-transparent transition-all duration-150"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-semibold leading-6 text-neutral-800 dark:text-neutral-200">
                      Password
                    </label>
                  </div>
                  <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-600 focus-visible:ring-2 focus-visible:border-transparent transition-all duration-150"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-600 dark:border-neutral-800 dark:bg-neutral-950"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <span className="font-semibold text-neutral-400 cursor-not-allowed">
                      Forgot password?
                    </span>
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:shadow-none hover:scale-[1.01] active:scale-[0.99] transition-all duration-150"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>

            <div className="mt-8 border-t border-neutral-100 dark:border-neutral-800 pt-6">
              <div className="rounded-xl bg-slate-50 dark:bg-neutral-950 p-4 border border-neutral-200/50 dark:border-neutral-800/50 text-xs">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">Quick Test Login:</span>
                <div className="flex flex-col gap-1 text-neutral-500 dark:text-neutral-400 font-mono">
                  <div>Email: <span className="text-neutral-700 dark:text-neutral-200">admin@bizloom.com</span></div>
                  <div>Pass: <span className="text-neutral-700 dark:text-neutral-200">Admin123!</span></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
