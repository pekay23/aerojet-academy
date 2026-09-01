import { Metadata } from 'next'
import { getInstructorStudents, getInstructorFormerStudents } from '@/lib/actions/instructor'
import InstructorStudentsView from './_components/InstructorStudentsView'

export const metadata: Metadata = { title: 'My Students | Instructor Portal' }
export const dynamic = 'force-dynamic'

export default async function Page() {
  const [students, formerStudents] = await Promise.all([
    getInstructorStudents(),
    getInstructorFormerStudents(),
  ])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white sm:text-3xl">
          My Students
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage and view profiles for students across your assigned modules.
        </p>
      </div>

      <InstructorStudentsView initialStudents={students} initialFormerStudents={formerStudents} />
    </div>
  )
}
