'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Mail, Lock, User, Briefcase, Loader2, ArrowRight, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';

export default function RegisterPage() {
  const [step, setStep] = useState<'REGISTER' | 'OTP'>('REGISTER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // OTP Verification States
  const [otpCode, setOtpCode] = useState('');
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { register, verifyOTP, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill out all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register(email, password, name);
      toast.success('Registration successful! Verification code sent.');
      router.push(`/verify-email?email=${encodeURIComponent(email)}&mockOtp=${encodeURIComponent(res?.mockOtp || '')}`);
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error('Please enter the full 6-digit OTP verification code');
      return;
    }

    setSubmitting(true);
    try {
      await verifyOTP(email, otpCode);
      toast.success('Account verified successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return null;
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
            Manage your assets, finances, and team.
          </h1>
          <p className="text-lg text-neutral-300 font-medium mb-8 leading-relaxed">
            Configure accounts, toggle customized features by role, track team productivity, and execute transactional audits on our responsive dashboard.
          </p>

          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-200 backdrop-blur-md">
              ✦ Any Domain Supported (@gmail, @yahoo, etc.)
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-200 backdrop-blur-md">
              ✦ 6-Digit OTP Security Verification
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-200 backdrop-blur-md">
              ✦ Dark Mode support
            </span>
          </div>
        </div>

        <div className="absolute bottom-6 left-8 text-xs text-neutral-500">
          © 2026 Bizloom, Inc. All rights reserved.
        </div>
      </div>

      {/* Right side: Register or OTP form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-neutral-900 border-l border-neutral-200/50 dark:border-neutral-800/50">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight dark:text-white">Bizloom</span>
          </div>

          {step === 'REGISTER' ? (
            <>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Create an account
                </h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="mt-8">
                <Card className="border-0 shadow-none bg-transparent">
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold leading-6 text-neutral-800 dark:text-neutral-200">
                        Full Name
                      </label>
                      <div className="relative mt-1.5 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <User className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          placeholder="Jane Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-600 focus-visible:ring-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold leading-6 text-neutral-800 dark:text-neutral-200">
                        Email address
                      </label>
                      <div className="relative mt-1.5 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Mail className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="jane@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-600 focus-visible:ring-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold leading-6 text-neutral-800 dark:text-neutral-200">
                        Password
                      </label>
                      <div className="relative mt-1.5 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Lock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          required
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-600 focus-visible:ring-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold leading-6 text-neutral-800 dark:text-neutral-200">
                        Confirm Password
                      </label>
                      <div className="relative mt-1.5 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Lock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-600 focus-visible:ring-2"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending OTP...
                          </>
                        ) : (
                          <>
                            Register Account
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-4">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Verify OTP Code
                </h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Enter the 6-digit code sent to <span className="font-semibold text-neutral-900 dark:text-neutral-100">{email}</span>
                </p>
              </div>

              {/* Sandbox mock OTP banner */}
              {mockOtp && (
                <div className="mt-4 p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span><strong>Sandbox Mock OTP:</strong> Check code below</span>
                  </div>
                  <span className="font-mono font-bold text-sm bg-indigo-600 text-white px-2 py-0.5 rounded-lg shadow-sm">
                    {mockOtp}
                  </span>
                </div>
              )}

              <div className="mt-6">
                <Card className="border-0 shadow-none bg-transparent">
                  <form onSubmit={handleOtpSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="otpCode" className="block text-sm font-semibold leading-6 text-neutral-800 dark:text-neutral-200">
                        6-Digit Verification Code
                      </label>
                      <div className="relative mt-2 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <KeyRound className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <Input
                          id="otpCode"
                          name="otpCode"
                          type="text"
                          maxLength={6}
                          required
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="pl-10 h-12 text-lg tracking-[0.3em] font-mono rounded-xl bg-slate-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      <Button
                        type="submit"
                        disabled={submitting || otpCode.length < 6}
                        className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify & Activate Account
                            <CheckCircle2 className="h-4 w-4" />
                          </>
                        )}
                      </Button>

                      <button
                        type="button"
                        onClick={() => setStep('REGISTER')}
                        className="w-full text-xs text-center text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 py-1 transition-colors flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Back to Register Form
                      </button>
                    </div>
                  </form>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
