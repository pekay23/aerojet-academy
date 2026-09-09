import { Metadata } from 'next'
import { getInstructorResources } from '@/lib/actions/instructor'
import ResourcesView from './_components/ResourcesView'

export const metadata: Metadata = { title: 'Teaching Resources | Instructor Portal' }
export const dynamic = 'force-dynamic'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    limit?: string
    sortBy?: string
    sortOrder?: string
    search?: string
    category?: string
  }>
}) {
  const params = await searchParams
  const resourcesData = await getInstructorResources({
    page: parseInt(params.page || '1'),
    limit: parseInt(params.limit || '20'),
    sortBy: params.sortBy,
    sortOrder: (params.sortOrder as 'asc' | 'desc') || 'desc',
    search: params.search,
    category: params.category,
  })

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

      <ResourcesView
        initialResources={resourcesData?.resources || []}
        meta={resourcesData?.meta}
        searchParams={params}
      />
    </div>
  )
}
