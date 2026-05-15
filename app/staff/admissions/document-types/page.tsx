import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import DocumentTypeManager from './_components/DocumentTypeManager'

export const metadata: Metadata = { title: 'Document Types | Admissions | Staff Portal' }

export default async function DocumentTypesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  return <DocumentTypeManager />
}
