'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, KeyRound, CheckCircle2, RefreshCw, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

function maskEmail(email: string) {
  if (!email || !email.includes('@')) return 'your email';
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialMockOtp = searchParams.get('mockOtp') || '';

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [mockOtp, setMockOtp] = useState<string>(initialMockOtp);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  // Error & Expired states
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Resend cooldown countdown (60 seconds)
  const [cooldown, setCooldown] = useState(60);

  const { verifyOTP, resendOTP, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Input refs for auto-focusing
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Cooldown timer interval
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    setInlineError(null);
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length > 1) {
      // User pasted multiple digits
      const pasted = cleaned.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((char, idx) => {
        if (index + idx < 6) {
          newDigits[index + idx] = char;
        }
      });
      setDigits(newDigits);
      const nextFocus = Math.min(5, index + pasted.length);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    // Auto-advance to next box if digit typed
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const fullCode = digits.join('');

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email address is required');
      return;
    }
    if (fullCode.length < 6) {
      toast.error('Please enter the full 6-digit OTP code');
      return;
    }

    setSubmitting(true);
    setInlineError(null);

    try {
      await verifyOTP(email, fullCode);
      toast.success('Email verified! Please log in.');
      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (error: any) {
      if (error.code === 'OTP_EXPIRED') {
        setIsExpired(true);
        setInlineError('This code has expired, please request a new one');
        toast.error('Verification code expired');
      } else {
        setInlineError(error.message || 'Invalid OTP, please try again');
        toast.error(error.message || 'Invalid OTP, please try again');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address is required');
      return;
    }
    setResending(true);
    setInlineError(null);
    setIsExpired(false);
    setDigits(['', '', '', '', '', '']);

    try {
      const res = await resendOTP(email);
      if (res?.mockOtp) {
        setMockOtp(res.mockOtp);
      }
      setCooldown(60);
      toast.success('A new verification code has been sent to your email.');
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (isLoading || isAuthenticated) return null;

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50 dark:bg-neutral-950 font-sans">
      {/* Left side: Premium brand gradient illustration */}
      <div className="relative hidden w-1/2 items-center justify-center bg-neutral-900 lg:flex overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-600/35 blur-[120px] dark:bg-indigo-500/20" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-teal-500/20 blur-[100px]" />
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
            Security verification for your enterprise.
          </h1>
          <p className="text-lg text-neutral-300 font-medium mb-8 leading-relaxed">
            Protect your business environment with single-use verification codes and strict role privilege scoping.
          </p>
        </div>

        <div className="absolute bottom-6 left-8 text-xs text-neutral-500">
          © 2026 Bizloom, Inc. All rights reserved.
        </div>
      </div>

      {/* Right side: Verification Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-neutral-900 border-l border-neutral-200/50 dark:border-neutral-800/50">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-indigo-600 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Sign in
          </Link>

          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-4">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Verify your email
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Enter the 6-digit verification code sent to{' '}
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{maskEmail(email)}</span>
            </p>
          </div>

          {/* Sandbox Developer OTP Display */}
          {mockOtp && (
            <div className="mt-4 p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-xs flex items-center justify-between text-indigo-700 dark:text-indigo-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span><strong>Developer OTP Code:</strong></span>
              </div>
              <span className="font-mono font-bold text-sm bg-indigo-600 text-white px-2.5 py-0.5 rounded-lg shadow-xs">
                {mockOtp}
              </span>
            </div>
          )}

          {/* Inline Error Banner */}
          {inlineError && (
            <div className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center gap-2 font-semibold ${
              isExpired
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400'
            }`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{inlineError}</span>
            </div>
          )}

          <div className="mt-6">
            <Card className="border-0 shadow-none bg-transparent">
              <form onSubmit={handleVerifySubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">
                    6-Digit Security Code
                  </label>
                  
                  {/* 6 Individual Digit Input Boxes */}
                  <div className="flex items-center justify-between gap-2">
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => { inputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        disabled={isExpired || submitting}
                        onChange={e => handleDigitChange(idx, e.target.value)}
                        onKeyDown={e => handleKeyDown(idx, e)}
                        className={`h-12 w-11 sm:w-12 text-center text-xl font-black font-mono rounded-xl border transition-all duration-150 ${
                          digit
                            ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100'
                        } focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none disabled:opacity-50`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={submitting || fullCode.length < 6 || isExpired}
                    className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Email Address
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  {/* Resend OTP button with 60-second cooldown */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-neutral-400 font-medium">Didn't receive the code?</span>
                    <button
                      type="button"
                      disabled={cooldown > 0 || resending}
                      onClick={handleResend}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                      {cooldown > 0 ? `Resend OTP in ${cooldown}s` : resending ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
