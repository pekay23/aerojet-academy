'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'

interface Course {
  id: string
  code: string
  name: string
}

interface LicenseCategory {
  id: string
  code: string
  name: string
  requirements: { id: string; courseId: string; course: Course }[]
}

export default function LicenseRequirementsClient({
  licenseCategories,
  courses,
}: {
  licenseCategories: LicenseCategory[]
  courses: Course[]
}) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)

  // Build a set of "licenseCategoryId:courseId" for quick lookup
  const requiredSet = new Set<string>()
  for (const lc of licenseCategories) {
    for (const req of lc.requirements) {
      requiredSet.add(`${lc.id}:${req.courseId}`)
    }
  }

  const handleToggle = useCallback(
    async (licenseCategoryId: string, courseId: string, isCurrentlyRequired: boolean) => {
      const key = `${licenseCategoryId}:${courseId}`
      setToggling(key)
      try {
        const res = await fetch('/api/staff/license-requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseCategoryId,
            courseId,
            action: isCurrentlyRequired ? 'remove' : 'add',
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          alert(data.error || 'Failed to update')
        }
        router.refresh()
      } catch {
        alert('Network error')
      } finally {
        setToggling(null)
      }
    },
    [router]
  )

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#002a5c] dark:text-white">
          <Shield className="h-6 w-6 text-blue-600" />
          License Module Requirements
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure which EASA modules are required for each license category. Click cells to toggle.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-xs font-black tracking-widest text-slate-400 uppercase dark:bg-slate-900">
                Module
              </th>
              {licenseCategories.map((lc) => (
                <th
                  key={lc.id}
                  className="px-3 py-3 text-center text-xs font-black tracking-wider text-slate-500"
                >
                  {lc.code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr
                key={course.id}
                className="border-b border-slate-50 transition-colors hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/30"
              >
                <td className="sticky left-0 z-10 bg-white px-4 py-2 dark:bg-slate-900">
                  <span className="mr-2 font-mono text-xs font-bold text-slate-400">
                    {course.code}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{course.name}</span>
                </td>
                {licenseCategories.map((lc) => {
                  const key = `${lc.id}:${course.id}`
                  const isRequired = requiredSet.has(key)
                  const isLoading = toggling === key

                  return (
                    <td key={lc.id} className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleToggle(lc.id, course.id, isRequired)}
                        disabled={isLoading}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-all ${
                          isRequired
                            ? 'border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                            : 'border-slate-200 bg-white text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600'
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isRequired ? (
                          <span className="text-xs font-black">R</span>
                        ) : (
                          <span className="text-xs">&ndash;</span>
                        )}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-blue-300 bg-blue-100 text-[10px] font-black text-blue-700">
            R
          </span>
          Required
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-white text-[10px] text-slate-300">
            &ndash;
          </span>
          Not required
        </div>
      </div>
    </div>
  )
}
