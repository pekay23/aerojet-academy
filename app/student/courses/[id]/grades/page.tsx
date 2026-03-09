import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Course Grades" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#002a5c] sm:text-3xl dark:text-white">Course Grades</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your grades for this course.</p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h2 className="text-lg font-bold text-slate-700 mb-2">Coming Soon</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">This feature is under development and will be available soon.</p>
      </div>
    </div>
  );
}
