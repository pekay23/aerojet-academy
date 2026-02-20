import { Metadata } from 'next'
import { getInstructorResources } from '@/lib/actions/instructor'
import ResourcesView from './_components/ResourcesView'

export const metadata: Metadata = { title: 'Teaching Resources | Instructor Portal' }

export default async function Page() {
  const resources = await getInstructorResources()

  return (
    <div className="flex flex-col space-y-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Teaching Resources
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Access your module syllabi, training materials, and institutional guidelines.
        </p>
      </div>

      <ResourcesView initialResources={resources || []} />
    </div>
  )
}
