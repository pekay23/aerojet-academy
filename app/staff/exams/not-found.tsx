import Link from 'next/link'

export default function ExamsNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <p className="text-aerojet-blue mb-2 text-xs font-black tracking-widest uppercase">
          404 · Exams
        </p>
        <h2 className="mb-2 text-2xl font-black text-slate-900 dark:text-slate-100">
          Resource not found
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          The exam resource you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/staff/exams"
          className="bg-aerojet-blue hover:bg-aerojet-sky inline-block rounded-xl px-6 py-3 text-xs font-bold tracking-widest text-white uppercase transition-colors"
        >
          Back to exams
        </Link>
      </div>
    </div>
  )
}
