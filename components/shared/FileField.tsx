'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, FileUp, Loader2, X, AlertCircle } from 'lucide-react'
import { UploadButton } from '@/lib/uploads/uploadthing'
import type { OurFileRouter } from '@/app/api/uploadthing/core'

/**
 * Controlled file-upload field with explicit visual states.
 *
 * Wraps `UploadButton` from `@uploadthing/react` and renders a stable
 * "empty → uploading → uploaded" pill so the user never sees a half-state
 * (which was the original KNOWN_ISSUES complaint — the bare UploadButton
 * sometimes lost its visual state on re-render).
 *
 * Usage:
 *   <FileField
 *     route="paymentProof"
 *     value={proofUrl}
 *     onChange={setProofUrl}
 *     label="Payment proof"
 *   />
 */
export interface FileFieldProps {
  /** UploadThing route slug, e.g. "paymentProof" / "applicantDocument" */
  route: keyof OurFileRouter
  /** Current file URL — `null` / `''` for empty */
  value: string | null
  /** Called when the upload completes successfully (or the user removes) */
  onChange: (url: string | null) => void
  /** Visible label above the field */
  label?: string
  /** Helper text below the field */
  hint?: string
  /** Disable while a parent operation is in flight */
  disabled?: boolean
  /** Surface error state (e.g. parent rejected the URL) */
  error?: string | null
  /** Override the default success message */
  successMessage?: string
}

export default function FileField({
  route,
  value,
  onChange,
  label,
  hint,
  disabled = false,
  error = null,
  successMessage = 'Uploaded',
}: FileFieldProps) {
  const [uploading, setUploading] = useState(false)
  const hasFile = !!value

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-bold tracking-widest text-slate-500 uppercase">{label}</label>
      )}

      {hasFile ? (
        // ── Uploaded state ─────────────────────────────────────────────
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-900/20">
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="truncate text-sm font-medium text-emerald-800 dark:text-emerald-300">
              {successMessage}
            </span>
            <a
              href={value!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
            >
              view
            </a>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="rounded-lg p-1.5 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // ── Empty / uploading state ────────────────────────────────────
        <div
          className={`rounded-xl border ${
            error
              ? 'border-red-200 bg-red-50'
              : uploading
                ? 'border-blue-200 bg-blue-50'
                : 'border-slate-200 bg-white'
          } p-3 transition-colors`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <FileUp className="h-4 w-4 shrink-0 text-slate-400" />
              <UploadButton
                endpoint={route as never}
                input={undefined as never}
                disabled={disabled}
                onUploadBegin={() => setUploading(true)}
                onClientUploadComplete={(res) => {
                  setUploading(false)
                  const url = res?.[0]?.ufsUrl
                  if (url) {
                    onChange(url)
                    toast.success(successMessage)
                  } else {
                    toast.error('Upload finished but no URL was returned')
                  }
                }}
                onUploadError={(e) => {
                  setUploading(false)
                  toast.error(e.message || 'Upload failed')
                }}
                appearance={{
                  button:
                    'ut-uploading:!cursor-wait ut-uploading:!bg-blue-500 !bg-aerojet-blue hover:!bg-aerojet-sky !text-white !text-xs !font-bold !tracking-widest !uppercase !h-9 !px-4 !rounded-lg !transition-colors',
                  allowedContent: 'hidden',
                }}
              />
              {hint && <span className="text-xs text-slate-500">{hint}</span>}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}
