"use client";
export default function StudentTranscriptError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="alert">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">An unexpected error occurred while loading your transcript. Please try again or contact support if the problem persists.</p>
        <button onClick={reset} className="bg-blue-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-sky-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-800/50">
          Try Again
        </button>
      </div>
    </div>
  );
}
