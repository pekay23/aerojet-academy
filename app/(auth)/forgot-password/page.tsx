"use client";

import { useState } from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

// export const metadata: Metadata = { title: "Forgot Password | Aerojet Academy" };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send reset email");
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-[#002a5c] uppercase tracking-tight mb-3">Check Your Email</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          If an account exists for <strong className="text-slate-700">{email}</strong>, we've sent a password reset link.
        </p>
        <Link href="/login" className="inline-flex items-center gap-2 text-[#4c9ded] font-bold text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-[#002a5c] uppercase tracking-tight">Reset Password</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Enter the email associated with your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4c9ded] focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button type="submit" disabled={loading || !email} className="w-full bg-[#002a5c] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#4c9ded] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Reset Link"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-[#4c9ded] font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </div>
    </div>
  );
}
