import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { Award, CheckCircle2, Circle } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import { getLicenseProgress } from '@/lib/license/progress'

export const metadata: Metadata = {
  title: 'License Progress | Student Portal',
  description: 'Track your progress toward each EASA license category.',
}

export default async function LicenseProgressPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const progress = await getLicenseProgress(session.user.id)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
          License Progress
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your progress toward each EASA license category you are targeting.
        </p>
      </div>

      {progress.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <Award className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            No license target set
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Once a license category is assigned to your profile, your module progress will appear
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {progress.map((lp) => (
            <div
              key={lp.licenseCategoryId}
              className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {lp.name}
                  </h2>
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    {lp.code}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-800 dark:text-sky-400">
                    {lp.percentage}%
                  </span>
                  <p className="text-xs text-slate-400">
                    {lp.passedCount}/{lp.totalRequired} modules passed
                  </p>
                </div>
              </div>

              <div className="my-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${lp.percentage}%` }}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {lp.modules.map((m) => (
                  <div
                    key={m.courseId}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
                      m.passed
                        ? 'border-emerald-100 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20'
                        : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
                    }`}
                  >
                    {m.passed ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 flex-shrink-0 text-slate-300" />
                    )}
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                        {m.code}
                      </span>
                      <p className="truncate text-xs text-slate-500" title={m.name}>
                        {m.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
