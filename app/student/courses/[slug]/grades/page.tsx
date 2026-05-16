import { Metadata } from "next";
import Link from "next/link";
import { Construction } from "lucide-react";

export const metadata: Metadata = {
  title: "Course Grades",
  description: "View your grades and assessment results for this course.",
};

export default function Page() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">Course Grades</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your grades for this course.</p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Construction className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Coming Soon</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">Course grades will appear here once your instructor has published them.</p>
      </div>
    </div>
  );
}
