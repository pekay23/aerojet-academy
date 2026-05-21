'use client'

import SettingsForm from './SettingsForm'
import { FileText, Award } from 'lucide-react'

const PDF_FIELDS = [
  {
    key: 'pdf_header_logo_url',
    label: 'Header Logo URL',
    description:
      'URL or path to the logo image displayed in the header. Default is the Academy logo.',
    type: 'STRING' as const,
    default: '/apple-touch-icon.webp',
  },
  {
    key: 'pdf_watermark_url',
    label: 'Watermark Image URL',
    description: 'URL or path to the watermark image displayed in the background.',
    type: 'STRING' as const,
    default: '/apple-touch-icon.webp',
  },
  {
    key: 'pdf_footer_text',
    label: 'Footer Text',
    description: 'Custom text to display in the footer of all PDFs.',
    type: 'STRING' as const,
    default: 'Aerojet Aviation Academy | 123 Flight Way | contact@aerojet.com',
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
}

export default function PDFSettingsForm({ values }: PDFSettingsFormProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Template Previews</h3>
        <p className="mb-6 text-sm text-gray-500">
          Preview how your PDF settings will look in the generated documents. Make sure to save your
          settings below before previewing.
        </p>
        <div className="flex gap-4">
          <a
            href="/api/pdf/test-template?type=transcript"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            <FileText className="h-4 w-4" />
            Preview Transcript
          </a>
          <a
            href="/api/pdf/test-template?type=certificate"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            <Award className="h-4 w-4" />
            Preview Certificate
          </a>
        </div>
      </div>

      <SettingsForm fields={PDF_FIELDS} values={values} groupLabel="PDF Templates" />
    </div>
  )
}
