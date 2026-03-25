import { Metadata } from 'next'
import { getInstructorProfile } from '@/lib/actions/instructor'
import InstructorProfileView from '../_components/InstructorProfileView'

export const metadata: Metadata = {
  title: 'My Profile | Instructor Portal',
}

export default async function InstructorProfilePage() {
  const profile = await getInstructorProfile()

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Manage Profile
        </h1>
        <p className="mt-2 text-lg font-medium text-slate-500 dark:text-slate-400">
          Viewing and updating your instructor account details.
        </p>
      </div>

      <InstructorProfileView initialData={profile as any} />
    </div>
  )
}
