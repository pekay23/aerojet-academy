import { getSystemSettings } from '@/lib/system-settings'
import fs from 'fs'
import path from 'path'

export interface PDFSettings {
  logoUrl: string
  watermarkUrl: string
  footerText: string
  watermarkOpacity: number
}

/**
 * Reads a local image file and returns a data: URI (base64-encoded).
 * This is the most reliable way to embed images in @react-pdf/renderer
 * since it avoids all URL resolution, fetch, and cross-platform path issues.
 *
 * @react-pdf/renderer does NOT support .webp — only PNG and JPG.
 */
function readImageAsDataUri(filePath: string): string | null {
  try {
    // Normalize: strip any leading /public or public prefix to avoid double public/public/
    let normalized = filePath.replace(/^\/?(public)\//i, '/')
    const absolutePath = normalized.startsWith('/')
      ? path.join(process.cwd(), 'public', normalized)
      : normalized

    if (!fs.existsSync(absolutePath)) {
      console.warn(`[PDF] Image not found: ${absolutePath}`)
      return null
    }

    const stats = fs.statSync(absolutePath)
    if (stats.size === 0) {
      console.warn(`[PDF] Image is empty (0 bytes): ${absolutePath}`)
      return null
    }

    const buffer = fs.readFileSync(absolutePath)

    // Detect actual format from magic bytes (don't trust the file extension!)
    // PNG: 89 50 4E 47 (‰PNG)
    // JPEG: FF D8 FF
    let mime: string | null = null
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      mime = 'image/png'
    } else if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      mime = 'image/jpeg'
    }

    if (!mime) {
      console.warn(`[PDF] Unsupported image format (not PNG/JPG by magic bytes): ${absolutePath}`)
      return null
    }

    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch (err) {
    console.error(`[PDF] Failed to read image: ${filePath}`, err)
    return null
  }
}

/**
 * Resolves an image URL to a data URI for react-pdf.
 * For remote (non-localhost) HTTPS URLs, returns the URL as-is.
 * For local files, reads and base64-encodes them.
 */
function resolveImageForPdf(rawUrl: string): string | null {
  // Remote production URLs — react-pdf can fetch these directly
  if (rawUrl.startsWith('https://') && !rawUrl.includes('localhost')) {
    return rawUrl
  }

  // Local relative path or absolute path — read as data URI
  return readImageAsDataUri(rawUrl)
}

/**
 * PNG fallback defaults — @react-pdf/renderer does NOT support .webp
 */
const DEFAULT_LOGO = '/images/logos/AATA_logo_hor_onWhite.png'
const DEFAULT_WATERMARK = '/apple-touch-icon.png'

/**
 * Fetches PDF-specific system settings and resolves image URLs
 * to data URIs supported by @react-pdf/renderer (PNG/JPG only).
 */
export async function getPDFSettings(hostOrigin: string): Promise<PDFSettings> {
  const settings = await getSystemSettings([
    'pdf_header_logo_url',
    'pdf_watermark_url',
    'pdf_footer_text',
    'pdf_watermark_opacity',
  ])

  // Enforce PNG/JPG — reject .webp since react-pdf cannot render it
  let logoRaw = settings['pdf_header_logo_url'] || DEFAULT_LOGO
  let watermarkRaw = settings['pdf_watermark_url'] || DEFAULT_WATERMARK

  if (logoRaw.endsWith('.webp')) logoRaw = DEFAULT_LOGO
  if (watermarkRaw.endsWith('.webp')) watermarkRaw = DEFAULT_WATERMARK

  const footerText =
    settings['pdf_footer_text'] || 'Small Engines Dept., ATTC\nKokomlemle, Accra — Ghana'
  const watermarkOpacity = parseFloat(settings['pdf_watermark_opacity'] || '0.15')

  const logoUrl = resolveImageForPdf(logoRaw) || ''
  const watermarkUrl = resolveImageForPdf(watermarkRaw) || ''

  return {
    logoUrl,
    watermarkUrl,
    footerText,
    watermarkOpacity: isNaN(watermarkOpacity) ? 0.15 : Math.max(0, Math.min(1, watermarkOpacity)),
  }
}
