'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Mail, Loader2, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { forgotPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      toast.success('Password reset code sent to your email!');
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}&mockOtp=${encodeURIComponent(res?.mockOtp || '')}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to request password reset');
    } finally {
      setSubmitting(false);
    }
  };

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
            Account Recovery Made Secure & Simple.
          </h1>
          <p className="text-lg text-neutral-300 font-medium mb-8 leading-relaxed">
            Enter your registered email address to receive a single-use 6-digit verification code to reset your account password.
          </p>
        </div>
        
        <div className="absolute bottom-6 left-8 text-xs text-neutral-500">
          © 2026 Bizloom, Inc. All rights reserved.
        </div>
      </div>

      {/* Right side: Forgot Password Form */}
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
              Forgot password?
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              No worries! Enter your account email address below and we'll send you a password reset OTP code.
            </p>
          </div>

          <div className="mt-8">
            <Card className="border-0 shadow-none bg-transparent">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold leading-6 text-neutral-800 dark:text-neutral-200">
                    Registered Email address
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
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:shadow-none hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending Reset Code...
                      </>
                    ) : (
                      <>
                        Send Reset Code
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
