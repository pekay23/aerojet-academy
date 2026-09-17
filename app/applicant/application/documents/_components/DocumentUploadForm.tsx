'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UploadButton } from '@/lib/uploads/uploadthing'
import { CheckCircle2, XCircle, Clock, FileText, AlertTriangle, RefreshCw } from 'lucide-react'
import { useFormDirty } from '@/hooks/useFormDirty'

export interface DocumentType {
  id: string
  name: string
  slug: string
  description: string | null
  fileTypes: string
  maxSizeMB: number
  isRequired: boolean
}

export interface UploadedDocument {
  id: string
  documentTypeId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason: string | null
  documentType: { id: string; name: string; slug: string }
  fileUpload: { id: string; url: string; filename: string }
}

interface DocumentUploadFormProps {
  documentTypes: DocumentType[]
  uploadedDocuments: UploadedDocument[]
  applicationId: string
  onRefresh: () => void
}

const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    label: 'Under Review',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  APPROVED: {
    icon: CheckCircle2,
    label: 'Approved',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  REJECTED: {
    icon: XCircle,
    label: 'Rejected',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
}

export default function DocumentUploadForm({
  documentTypes,
  uploadedDocuments,
  applicationId: _applicationId,
  onRefresh,
}: DocumentUploadFormProps) {
  const [uploading, setUploading] = useState<string | null>(null)
  const { markDirty, markClean } = useFormDirty()

  const getUploadedDoc = (typeId: string) =>
    uploadedDocuments.find((d) => d.documentTypeId === typeId)

  const requiredTypes = documentTypes.filter((dt) => dt.isRequired)
  const optionalTypes = documentTypes.filter((dt) => !dt.isRequired)
  const allRequired = requiredTypes.every((dt) => {
    const doc = getUploadedDoc(dt.id)
    return doc && doc.status !== 'REJECTED'
  })

  async function linkUploadedFile(
    typeId: string,
    fileUrl: string,
    fileName: string,
    fileSize: number,
    fileType: string
  ) {
    setUploading(typeId)
    try {
      const res = await fetch('/api/applicant/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTypeId: typeId,
          fileUrl,
          fileName,
          fileSize,
          fileType,
        }),
      })

      if (res.ok) {
        toast.success('Document uploaded successfully')
        onRefresh()
        markClean()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save document')
      }
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress Summary */}
      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-aerojet-blue text-lg font-black dark:text-white">
              Document Upload Progress
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {uploadedDocuments.length} of {documentTypes.length} documents uploaded
              {requiredTypes.length > 0 && ` · ${requiredTypes.length} required`}
            </p>
          </div>
          {allRequired && requiredTypes.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                All Required Complete
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="from-aerojet-blue to-aerojet-sky h-full rounded-full bg-linear-to-r transition-all duration-700"
            style={{
              width: `${documentTypes.length > 0 ? (uploadedDocuments.filter((d) => d.status !== 'REJECTED').length / documentTypes.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Required Documents */}
      {requiredTypes.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black tracking-widest text-red-600 uppercase">
            <AlertTriangle className="h-4 w-4" />
            Required Documents
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {requiredTypes.map((dt) => (
              <DocumentCard
                key={dt.id}
                docType={dt}
                uploaded={getUploadedDoc(dt.id)}
                uploading={uploading === dt.id}
                onUploaded={(url, name, size, type) =>
                  linkUploadedFile(dt.id, url, name, size, type)
                }
                onUploadBegin={markDirty}
              />
            ))}
          </div>
        </div>
      )}

      {/* Optional Documents */}
      {optionalTypes.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-black tracking-widest text-slate-400 uppercase">
            Optional Documents
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {optionalTypes.map((dt) => (
              <DocumentCard
                key={dt.id}
                docType={dt}
                uploaded={getUploadedDoc(dt.id)}
                uploading={uploading === dt.id}
                onUploaded={(url, name, size, type) =>
                  linkUploadedFile(dt.id, url, name, size, type)
                }
                onUploadBegin={markDirty}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentCard({
  docType,
  uploaded,
  uploading: _uploading,
  onUploaded,
  onUploadBegin,
}: {
  docType: DocumentType
  uploaded?: UploadedDocument
  uploading: boolean
  onUploaded: (url: string, name: string, size: number, type: string) => void
  onUploadBegin: () => void
}) {
  const status = uploaded ? STATUS_CONFIG[uploaded.status] : null
  const StatusIcon = status?.icon
  const showUploader = !uploaded || uploaded.status === 'REJECTED'

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
        uploaded
          ? `${status?.bg} ${status?.border}`
          : 'hover:border-aerojet-blue/40 dark:hover:border-aerojet-sky/40 border-dashed border-slate-300 bg-white hover:bg-blue-50/30 dark:border-slate-600 dark:bg-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-black text-slate-800 dark:text-white">{docType.name}</h4>
          {docType.description && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {docType.description}
            </p>
          )}
          <p className="mt-1 text-[10px] font-bold text-slate-400">
            Max {docType.maxSizeMB} MB ·{' '}
            {docType.fileTypes
              .split(',')
              .map((t) => t.split('/')[1])
              .join(', ')}
          </p>
        </div>

        {status && StatusIcon && (
          <div
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${status.bg} ${status.text}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black">{status.label}</span>
          </div>
        )}
      </div>

      {/* Uploaded file info */}
      {uploaded && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 dark:bg-black/20">
          <FileText className="h-4 w-4 text-slate-400" />
          <span className="flex-1 truncate text-xs font-bold text-slate-600 dark:text-slate-300">
            {uploaded.fileUpload.filename}
          </span>
          <a
            href={uploaded.fileUpload.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-aerojet-blue text-[10px] font-bold hover:underline"
          >
            View
          </a>
        </div>
      )}

      {/* Rejection reason */}
      {uploaded?.status === 'REJECTED' && uploaded.rejectionReason && (
        <div className="mt-2 rounded-lg bg-red-100 px-3 py-2 dark:bg-red-900/30">
          <p className="text-xs font-bold text-red-700 dark:text-red-400">
            Reason: {uploaded.rejectionReason}
          </p>
        </div>
      )}

      {/* Upload button via UploadThing */}
      {showUploader && (
        <div className="mt-4">
          {uploaded?.status === 'REJECTED' && (
            <p className="mb-2 flex items-center gap-1 text-xs font-bold text-slate-500">
              <RefreshCw className="h-3 w-3" /> Re-upload to replace rejected document
            </p>
          )}
          <UploadButton
            endpoint="applicantDocument"
            onUploadBegin={() => {
              onUploadBegin()
            }}
            onClientUploadComplete={(res) => {
              if (res?.[0]) {
                const file = res[0]
                onUploaded(
                  file.ufsUrl ?? file.url,
                  file.name,
                  file.size,
                  file.type ?? 'application/pdf'
                )
              }
            }}
            onUploadError={(error) => {
              toast.error(error.message || 'Upload failed')
            }}
            appearance={{
              button:
                'bg-aerojet-blue hover:bg-aerojet-blue/90 text-white text-xs font-bold px-4 py-2 rounded-xl ut-uploading:bg-slate-400',
              allowedContent: 'text-[10px] text-slate-400',
            }}
          />
        </div>
      )}
    </div>
  )
}
