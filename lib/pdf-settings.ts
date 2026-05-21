import { getSystemSettings } from '@/lib/system-settings'

export interface PDFSettings {
  logoUrl: string
  watermarkUrl: string
  footerText: string
  watermarkOpacity: number
}

/**
 * Fetches PDF-specific system settings and resolves relative URLs
 * to absolute URLs using the provided host origin.
 */
export async function getPDFSettings(hostOrigin: string): Promise<PDFSettings> {
  const settings = await getSystemSettings([
    'pdf_header_logo_url',
    'pdf_watermark_url',
    'pdf_footer_text',
    'pdf_watermark_opacity',
  ])

  const logoUrl = settings['pdf_header_logo_url'] || '/apple-touch-icon.webp'
  const watermarkUrl = settings['pdf_watermark_url'] || '/apple-touch-icon.webp'
  const footerText = settings['pdf_footer_text'] || 'Aerojet Aviation Academy | contact@aerojet.com'
  const watermarkOpacity = parseFloat(settings['pdf_watermark_opacity'] || '0.08')

  return {
    logoUrl: logoUrl.startsWith('/') ? `${hostOrigin}${logoUrl}` : logoUrl,
    watermarkUrl: watermarkUrl.startsWith('/') ? `${hostOrigin}${watermarkUrl}` : watermarkUrl,
    footerText,
    watermarkOpacity: isNaN(watermarkOpacity) ? 0.08 : Math.max(0, Math.min(1, watermarkOpacity)),
  }
}
