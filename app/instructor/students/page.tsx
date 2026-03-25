import { Metadata } from 'next'
import { getInstructorStudents } from '@/lib/actions/instructor'
import InstructorStudentsView from './_components/InstructorStudentsView'

export const metadata: Metadata = { title: 'My Students | Instructor Portal' }

export default async function Page() {
  const students = await getInstructorStudents()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          My Students
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Manage and view profiles for students across your assigned modules.
        </p>
      </div>

      <InstructorStudentsView initialStudents={students} />
    </div>
  )
}
