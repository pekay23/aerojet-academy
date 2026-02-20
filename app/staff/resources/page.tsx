import { Metadata } from 'next'
import { getAdminResources } from '@/lib/actions/resources'
import ResourceList from './_components/ResourceList'
import AddResourceButton from './_components/AddResourceButton'

export const metadata: Metadata = { title: 'Manage Resources | Staff Portal' }

export default async function StaffResourcesPage() {
  const resources = await getAdminResources()

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
            General Resources
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage institutional documents and shared materials.
          </p>
        </div>

        <AddResourceButton />
      </div>

      <ResourceList resources={resources} />
    </div>
  )
}
