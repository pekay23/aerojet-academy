'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { GraduationCap, RefreshCw, Search } from 'lucide-react'

interface Instructor {
  id: string
  email: string
  academyEmail: string | null
  profile: { firstName: string; lastName: string } | null
  instructorProfile: { employeeId: string | null; specialization: string | null } | null
}

export default function InstructorsTable() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchInstructors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ role: 'INSTRUCTOR', ...(search && { search }) })
      const res = await fetch(`/api/staff/users?${params}`)
      const data = await res.json()
      setInstructors(data.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchInstructors, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [fetchInstructors, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage teaching staff and their assignments
        </p>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search instructors..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-xs outline-none focus:ring-2 focus:ring-[#4c9ded] dark:border-slate-700 dark:bg-slate-800/50"
            />
          </div>
          <button
            onClick={fetchInstructors}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Instructor</th>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Specialization</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : instructors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                      <GraduationCap className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No instructors found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Instructors will appear here once added to the system.
                    </p>
                  </td>
                </tr>
              ) : (
                instructors.map((instructor) => (
                  <tr key={instructor.id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-[#002a5c] dark:bg-slate-800">
                          {instructor.profile?.firstName?.charAt(0)}
                          {instructor.profile?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {instructor.profile?.firstName} {instructor.profile?.lastName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{instructor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {instructor.instructorProfile?.employeeId ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {instructor.instructorProfile?.specialization ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {instructor.academyEmail ?? instructor.email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/staff/users/${instructor.id}`}
                        className="text-xs font-bold text-[#002a5c] hover:underline dark:text-[#4c9ded]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
