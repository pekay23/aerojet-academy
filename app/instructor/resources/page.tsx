import { Metadata } from 'next'
import { getInstructorResources } from '@/lib/actions/instructor'
import ResourcesView from './_components/ResourcesView'

export const metadata: Metadata = { title: 'Teaching Resources | Instructor Portal' }
export const dynamic = 'force-dynamic'

export default async function Page() {
  const resources = await getInstructorResources()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col space-y-6 duration-700">
      <div className="shrink-0">
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
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
