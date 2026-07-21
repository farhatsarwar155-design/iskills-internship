"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [devOtp, setDevOtp] = useState("");

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (!email) return;
    const fetchDevOtp = async () => {
      try {
        const res = await fetch(`/api/mock/otp?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.otp) {
            setDevOtp(data.otp);
          }
        }
      } catch (err) {
        // Silently ignore
      }
    };
    fetchDevOtp();
  }, [email]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleAutofill = () => {
    if (devOtp) {
      setOtp(devOtp);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a 6-digit verification code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccess("Account verified successfully! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl relative z-10">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-3">
          <span className="text-2xl font-black text-white">H</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
          Verify Account
        </h1>
        <p className="text-zinc-400 text-sm mt-2 text-center">
          We've sent a 6-digit OTP to <br />
          <span className="text-indigo-300 font-semibold">{email}</span>
        </p>
      </div>

      {devOtp && (
        <div 
          onClick={handleAutofill}
          id="dev-otp-helper"
          className="p-3 mb-6 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-700/50 rounded-xl text-indigo-300 text-xs text-center cursor-pointer hover:scale-[1.02] transition-all flex flex-col items-center gap-1 shadow-md shadow-indigo-950/20"
        >
          <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-400">Dev Helper</span>
          <span>Click to autofill OTP: <span className="font-mono font-bold text-sm tracking-widest text-white ml-1">{devOtp}</span></span>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-200 text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0 animate-ping"></span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 mb-6 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-200 text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 animate-pulse"></span>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider" htmlFor="otp">
              Verification Code
            </label>
            <span className={`text-xs font-mono font-semibold ${timeLeft < 60 ? "text-rose-400 animate-pulse" : "text-zinc-500"}`}>
              {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : "Code expired"}
            </span>
          </div>
          <input
            id="otp"
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-center text-2xl font-mono tracking-[10px] placeholder-zinc-800 outline-none transition-all text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading || timeLeft <= 0}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Verifying...</span>
            </>
          ) : (
            "Verify OTP"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-zinc-500 text-xs">
        Didn't receive a code?{" "}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-all">
          Register Again
        </Link>
      </p>
    </div>
  );
}

export default function VerifyOtp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 text-white relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl relative z-10 flex flex-col items-center justify-center">
          <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-zinc-400">Loading verification details...</span>
        </div>
      }>
        <VerifyOtpContent />
      </Suspense>
    </div>
  );
}
