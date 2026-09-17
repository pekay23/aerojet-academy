import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
        <AlertCircle className="h-12 w-12 text-slate-400" />
      </div>
      <h2 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
        Course Not Found
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        The course you are looking for does not exist or you do not have access to it.
      </p>
      <Link
        href="/student/courses"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800/90"
      >
        Back to Courses
      </Link>
    </div>
  )
}
