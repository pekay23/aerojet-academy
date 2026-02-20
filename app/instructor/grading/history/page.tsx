import { Metadata } from 'next'
import Link from 'next/link'
import { getGradingHistory } from '@/lib/actions/instructor'
import { History, User, Calendar, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Grading History | Instructor Portal' }

export default async function Page() {
  const history = await getGradingHistory()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Grading History
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Review and manage past assessments you've graded.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {history && history.length > 0 ? (
            history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-4 p-6 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">
                      {item.enrollment.course.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.assessmentName} — {item.assessmentType}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <User className="h-3.5 w-3.5" />
                        {item.user.profile?.firstName} {item.user.profile?.lastName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        Graded on {new Date(item.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {item.score.toString()}{' '}
                    <span className="text-xs font-bold text-slate-400">
                      / {item.maxScore.toString()}
                    </span>
                  </div>
                  <Link
                    href={`/instructor/grading/evaluate/${item.id}`}
                    className="text-[10px] font-black tracking-widest text-[#4c9ded] uppercase hover:underline"
                  >
                    Edit Grade
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400">
              <History className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p className="text-lg font-bold">No grading history</p>
              <p className="text-sm">You haven't submitted any grades yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
