import Link from 'next/link'

export default function StudentNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <p className="mb-2 text-xs font-black tracking-widest text-aerojet-blue uppercase">
          404 · Student portal
        </p>
        <h2 className="mb-2 text-2xl font-black text-slate-900 dark:text-slate-100">
          Page not found
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          The page you tried to open does not exist. Use the sidebar to navigate.
        </p>
        <Link
          href="/student"
          className="inline-block rounded-xl bg-aerojet-blue px-6 py-3 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-aerojet-sky"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
