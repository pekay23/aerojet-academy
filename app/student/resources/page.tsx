import { getStudentResources } from '@/lib/actions/resources'
import ResourcesView from '@/app/instructor/resources/_components/ResourcesView'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Student Resources | Student Portal',
}

export default async function StudentResourcesPage() {
  const resources = await getStudentResources()

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#22c55e] dark:text-white">
          Resources
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Access student handbooks, forms, and institutional materials.
        </p>
      </div>

      <ResourcesView initialResources={resources} />
    </div>
  )
}
