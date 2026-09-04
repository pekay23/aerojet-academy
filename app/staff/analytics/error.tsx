'use client'

export default function SectionError({ _error, reset }: { _error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-black text-slate-900 dark:text-white">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        This section failed to load. Try again or go back.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-aerojet-blue px-4 py-2 text-xs font-bold text-white hover:bg-aerojet-sky"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
