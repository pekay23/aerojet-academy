'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import SettingsForm from './SettingsForm'
import { toast } from 'sonner'
import { FileText, Award } from 'lucide-react'
import TemplateList from './TemplateList'
import SignatureManager from './SignatureManager'
import { useFormDirty } from '@/hooks/useFormDirty'

// Dynamically import PDFViewer with SSR disabled — @react-pdf/renderer needs DOM APIs
const LivePDFViewer = dynamic(() => import('./LivePDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-125 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
      <div className="flex flex-col items-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="font-medium text-slate-500">Loading PDF Previewer…</p>
      </div>
    </div>
  ),
})

const PDF_FIELDS = [
  {
    key: 'pdf_header_logo_url',
    label: 'Header Logo URL',
    description:
      'URL or path to the logo image displayed in the header. Must be PNG or JPG (not WebP).',
    type: 'STRING' as const,
    default: '/images/logos/AATA_logo_hor_onWhite.png',
  },
  {
    key: 'pdf_watermark_url',
    label: 'Watermark Image URL',
    description:
      'URL or path to the watermark image displayed in the background. Must be PNG or JPG (not WebP).',
    type: 'STRING' as const,
    default: '/apple-touch-icon.png',
  },
  {
    key: 'pdf_footer_text',
    label: 'Footer Text',
    description: 'Custom text to display in the footer of all PDFs.',
    type: 'STRING' as const,
    default: 'Aerojet Aviation Training Academy | 123 Flight Way | contact@aerojet.com',
  },
  {
    key: 'pdf_watermark_opacity',
    label: 'Watermark Opacity',
    description: 'Opacity of the watermark image (0.0 to 1.0).',
    type: 'NUMBER' as const,
    default: '0.1',
  },
]

interface PDFSettingsFormProps {
  values: Record<string, string>
  pdfSettings: {
    logoUrl: string
    watermarkUrl: string
    footerText: string
    watermarkOpacity: number
  }
}

export default function PDFSettingsForm({ values, pdfSettings }: PDFSettingsFormProps) {
  const [liveSettings, setLiveSettings] = useState(pdfSettings)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const { markDirty } = useFormDirty()

  const handleFormChange = (e: React.FormEvent<HTMLDivElement>) => {
    // Warn user before closing/refreshing if they have unsaved changes
    markDirty()
    const form = (e.currentTarget as HTMLElement).querySelector('form')
    if (form) {
      const formData = new FormData(form)
      setLiveSettings({
        logoUrl: (formData.get('pdf_header_logo_url') as string) || pdfSettings.logoUrl,
        watermarkUrl: (formData.get('pdf_watermark_url') as string) || pdfSettings.watermarkUrl,
        footerText: (formData.get('pdf_footer_text') as string) || pdfSettings.footerText,
        watermarkOpacity: parseFloat(
          (formData.get('pdf_watermark_opacity') as string) || String(pdfSettings.watermarkOpacity)
        ),
      })
    }
  }

  const handleDownloadPreview = async (type: string) => {
    try {
      setIsGenerating(type)

      const response = await fetch('/api/pdf/test-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          logoUrl: liveSettings.logoUrl,
          watermarkUrl: liveSettings.watermarkUrl,
          footerText: liveSettings.footerText,
          watermarkOpacity: liveSettings.watermarkOpacity,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.target = '_blank'
      a.download = `preview-${type}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (_error) {
      toast.error('Failed to download PDF preview')
    } finally {
      setIsGenerating(null)
    }
  }

  return (
    <div className="space-y-6" onChange={handleFormChange}>
      {/* ── Live Preview ── */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-900">
        <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">Live Preview</h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
          Preview how your PDF templates will look. Any changes you make to the settings below will
          update here automatically.
        </p>
        <LivePDFViewer pdfSettings={liveSettings} />
      </div>

      {/* ── Quick Preview Links (API-generated) ── */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
          Download Preview PDFs
        </h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
          Generate and download full PDF files using your current live settings above.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => handleDownloadPreview('transcript')}
            disabled={isGenerating === 'transcript'}
            className="inline-flex items-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating === 'transcript' ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Preview Transcript
          </button>
          <button
            type="button"
            onClick={() => handleDownloadPreview('certificate')}
            disabled={isGenerating === 'certificate'}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating === 'certificate' ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            Preview Certificate
          </button>
          <button
            type="button"
            onClick={() => handleDownloadPreview('invoice')}
            disabled={isGenerating === 'invoice'}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating === 'invoice' ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Preview Invoice
          </button>
          <button
            type="button"
            onClick={() => handleDownloadPreview('financial-report')}
            disabled={isGenerating === 'financial-report'}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating === 'financial-report' ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Preview Financial Report
          </button>
        </div>
      </div>

      {/* ── Settings Fields ── */}
      <SettingsForm fields={PDF_FIELDS} values={values} groupLabel="PDF Templates" />

      {/* ── Template Management ── */}
      <TemplateList />

      {/* ── Signature Management ── */}
      <SignatureManager />
    </div>
  )
}
