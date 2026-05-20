'use client'

export default function ExaminerError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="alert">
      <div className="max-w-md text-center">
        <h2 className="mb-2 text-xl font-black text-slate-900 dark:text-slate-100">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          An unexpected error occurred. Please try again or contact support if the problem
          persists.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-aerojet-blue px-6 py-3 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-aerojet-sky focus:ring-2 focus:ring-aerojet-blue/50 focus:outline-none"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
