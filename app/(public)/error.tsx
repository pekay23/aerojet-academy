"use client";

import Link from "next/link";

export default function PublicError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-black text-[#002a5c] uppercase tracking-tight mb-3">Something went wrong</h2>
        <p className="text-slate-500 mb-8 text-sm">We're sorry, an unexpected error occurred.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#4c9ded] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#002a5c] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}