"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function NotFound() {
  useEffect(() => {
    document.body.classList.add("force-navbar-solid");
    return () => document.body.classList.remove("force-navbar-solid");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <span className="text-4xl">🏷️</span>
        </div>
        <h1 className="text-7xl font-black text-[#002a5c] tracking-tighter mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight mb-4">Page Not Found</h2>
        <p className="text-slate-500 mb-10 text-sm leading-relaxed">
          The page you are looking for does not exist or has been moved to a new hangar. 
          Let's get you back on course.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-[#4c9ded] text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#002a5c] transition-all shadow-lg shadow-blue-500/20"
          >
            Go Home
          </Link>
          <Link
            href="/courses"
            className="bg-slate-100 text-slate-600 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
          >
            Explore Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
