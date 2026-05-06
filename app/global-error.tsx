'use client'

export const dynamic = 'force-dynamic'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 font-sans">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-xl">
          <h1 className="text-2xl font-black text-slate-800 uppercase">System Disturbance</h1>
          <p className="text-sm text-slate-600">
            A critical system disturbance has been encountered. Please reload the page.
          </p>
          <button
            onClick={() => reset()}
            className="w-full rounded-xl bg-blue-600 py-3 text-xs font-black tracking-widest text-white uppercase hover:bg-blue-700 transition-all"
          >
            Reset Flight Path
          </button>
        </div>
      </body>
    </html>
  )
}
