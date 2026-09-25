import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import DocumentTypeManager from './_components/DocumentTypeManager'

export const metadata: Metadata = { title: 'Document Types | Admissions | Staff Portal' }

export default async function DocumentTypesPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  return <DocumentTypeManager />
}
