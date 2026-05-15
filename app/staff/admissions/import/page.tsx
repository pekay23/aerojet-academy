import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import ImportWizard from './_components/ImportWizard'

export const metadata: Metadata = { title: 'Bulk Data Import | Admissions' }
export const dynamic = 'force-dynamic'

export default async function ImportDataPage() {
  await requireStaff()

  // Fetch custom fields so the wizard can offer them for mapping
  const customFields = await prismaUnfiltered.customFieldDefinition.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          Legacy Data Import
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Upload a CSV file to import historical applicant and student records.
        </p>
      </div>

      <ImportWizard customFields={customFields} />
    </div>
  )
}
