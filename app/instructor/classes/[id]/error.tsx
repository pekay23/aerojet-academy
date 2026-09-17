"use client";
export default function ClassError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{error.message}</p>
        <button onClick={reset} className="bg-aerojet-blue text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-aerojet-sky transition-colors">
          Try Again
        </button>
      </div>
    </div>
  );
}
