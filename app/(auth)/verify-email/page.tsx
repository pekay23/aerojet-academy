"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        if (!res.ok) throw new Error("Verification failed");
        setStatus("success");
        setMessage("Your email has been verified successfully.");
      } catch {
        setStatus("error");
        setMessage("This verification link is invalid or has expired.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="text-center">
      {status === "loading" && (
        <>
          <Loader2 className="w-12 h-12 text-[#4c9ded] animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-black text-[#002a5c] uppercase tracking-tight mb-3">Verifying Email</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Please wait...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-[#002a5c] uppercase tracking-tight mb-3">Email Verified</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{message}</p>
          <Link href="/login" className="inline-block bg-[#002a5c] text-white px-8 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#4c9ded] transition-all shadow-lg">
            Sign In to Your Account
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-[#002a5c] uppercase tracking-tight mb-3">Verification Failed</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{message}</p>
          <Link href="/login" className="text-[#4c9ded] font-bold text-sm hover:underline">Go to Login</Link>
        </>
      )}
    </div>
  );
}
