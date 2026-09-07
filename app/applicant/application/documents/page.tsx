'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, FileText } from 'lucide-react'
import DocumentUploadForm from './_components/DocumentUploadForm'
import type { DocumentType, UploadedDocument } from './_components/DocumentUploadForm'

interface DocumentsPageData {
  documentTypes: DocumentType[]
  uploadedDocuments: UploadedDocument[]
  applicationId: string
}

export default function DocumentsPage() {
  const [data, setData] = useState<DocumentsPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/applicant/documents')
      const json = await res.json()
      if (json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Failed to load documents')
      }
    } catch {
      setError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

   
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h2 className="text-lg font-black text-slate-600 dark:text-slate-300">
          {error === 'No application found'
            ? 'No Application Found'
            : 'Unable to Load Documents'}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {error === 'No application found'
            ? 'Your admissions application has not been created yet. Please complete registration first.'
            : 'Something went wrong. Please try refreshing the page.'}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white sm:text-3xl">
          Upload Documents
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Submit your application documents for review. Required documents must be uploaded before your application can proceed.
        </p>
      </div>

      <DocumentUploadForm
        documentTypes={data.documentTypes}
        uploadedDocuments={data.uploadedDocuments}
        applicationId={data.applicationId}
        onRefresh={fetchDocuments}
      />
    </div>
  )
}
