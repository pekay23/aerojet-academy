export default function StaffLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-aerojet-blue rounded-full animate-spin" aria-hidden="true" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );
}
