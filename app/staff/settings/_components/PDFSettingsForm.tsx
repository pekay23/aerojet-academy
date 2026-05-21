'use client'

import SettingsForm from './SettingsForm'

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
  return <SettingsForm fields={PDF_FIELDS} values={values} groupLabel="PDF Templates" />
}
