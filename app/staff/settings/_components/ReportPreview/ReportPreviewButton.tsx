'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Eye, X } from 'lucide-react'
import FocusTrap from '@/components/shared/FocusTrap'

export function ReportPreviewButton() {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const closePreview = () => {
    setPreviewHtml(null)
    // Return focus to the trigger button
    triggerRef.current?.focus()
  }

  const handlePreview = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/staff/settings/report-preview')
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || 'Failed to generate preview')
        return
      }
      const { data } = await res.json()
      setPreviewHtml(data.html)
    } catch {
      toast.error('Failed to generate report preview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={handlePreview}
        disabled={loading}
        aria-haspopup="dialog"
        aria-expanded={!!previewHtml}
        className="inline-flex items-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="sr-only">Loading preview</span>
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
        <span
          className={`transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}
          aria-live="polite"
        >
          {loading ? 'Generating...' : 'Preview Report'}
        </span>
      </button>

      {previewHtml && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closePreview}
        >
          <FocusTrap onEscape={closePreview}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Report Preview"
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[80vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-xl dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close preview"
                className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <div
                className="p-6 pt-12"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                aria-label="Report content"
                role="document"
              />
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  )
}
