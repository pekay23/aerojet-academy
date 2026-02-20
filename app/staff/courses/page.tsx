import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import Link from 'next/link'
import { Plus, BookOpen, MoreVertical } from 'lucide-react'
import CourseActionsMenu from '../_components/CourseActionsMenu'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Courses | Staff Portal' }

export default async function CoursesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const courses = await prisma.course.findMany({
    orderBy: { code: 'asc' },
  })

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Courses</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage academic courses and programs</p>
        </div>
        <Link
          href="/staff/courses/create"
          className="flex items-center gap-2 rounded-xl bg-[#002a5c] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#002a5c]/90"
        >
          <Plus className="h-4 w-4" />
          Create Course
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No courses found. Create one to get started.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="group hover:bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-600 dark:text-slate-400">{course.code}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        {course.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CourseActionsMenu courseId={course.id} courseName={course.name} />
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

