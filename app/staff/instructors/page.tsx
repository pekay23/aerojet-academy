import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import InstructorDirectory from './_components/InstructorDirectory'

export const metadata: Metadata = { title: 'Instructor Management | Staff' }
export const dynamic = 'force-dynamic'

export default async function InstructorsPage() {
  await requireStaff()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          Instructor Management
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Manage instructor profiles, qualifications, licence categories, and recency compliance.
        </p>
      </div>

      <InstructorDirectory />
    </div>
  )
}
