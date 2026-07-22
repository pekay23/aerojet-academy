import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { getStorageAdapter } from '@/lib/storage/proxy'
import sharp from 'sharp'

/**
 * Image transformation API route.
 *
 * Fetches an image from UploadThing (or any HTTP-accessible storage) via the
 * active storage adapter, applies transformations (watermark, resize, EXIF
 * stripping), and returns the processed image.
 *
 * Query params:
 *   - url:      The UploadThing / remote image URL (required)
 *   - w:        Optional max width (e.g. 800)
 *   - watermark: Set to "true" to overlay an "© Aerojet Academy" mark
 *   - strip:    Set to "true" to strip EXIF/metadata (default: true)
 *   - q:        Quality 1-100 (default: 85)
 *   - format:   Output format: webp, jpeg, png, avif (default: webp)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')
  const width = searchParams.get('w')
  const addWatermark = searchParams.get('watermark') === 'true'
  const stripMetadata = searchParams.get('strip') !== 'false'
  const quality = Math.min(100, Math.max(1, parseInt(searchParams.get('q') || '85', 10)))
  const format = (searchParams.get('format') || 'webp') as 'webp' | 'jpeg' | 'png' | 'avif'

  if (!imageUrl) {
    return new NextResponse(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 1. Authenticate (staff only) ──
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const role = session.user.role as string
  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'INSTRUCTOR', 'EXAMINER'].includes(role)
  if (!isStaff) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 2. Fetch the image via the active storage adapter ──
  const adapter = getStorageAdapter()
  let data: ArrayBuffer

  try {
    const result = await adapter.fetch(imageUrl)
    data = result.data
  } catch (err: any) {
    console.error('[image-transform] fetch error:', err.message)
    return new NextResponse(JSON.stringify({ error: 'Image not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 3. Transform with sharp ──
  try {
    const buffer = Buffer.from(data)
    let pipeline = sharp(buffer)

    // Strip EXIF metadata
    if (stripMetadata) {
      pipeline = pipeline.withMetadata({ exif: {} })
    }

    // Resize if width specified (maintain aspect ratio, no upscaling)
    if (width) {
      pipeline = pipeline.resize({
        width: parseInt(width, 10),
        withoutEnlargement: true,
        fit: 'inside',
      })
    }

    // Add watermark SVG overlay
    if (addWatermark) {
      const watermarkSvg = Buffer.from(`
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <style>
            .watermark { font-family: Arial, sans-serif; font-size: 16px; fill: rgba(255,255,255,0.4); }
          </style>
          <text x="10" y="30" class="watermark">© Aerojet Academy</text>
          <text x="10" y="50" class="watermark" font-size="12">${new Date().toISOString().split('T')[0]}</text>
        </svg>
      `)
      pipeline = pipeline.composite([{ input: watermarkSvg, top: 0, left: 0 }])
    }

    // Convert to requested format
    const formatOptions: Record<string, { quality: number }> = {
      webp: { quality },
      jpeg: { quality },
      png: { quality },
      avif: { quality },
    }

    const output = await (pipeline as any)[format](formatOptions[format]).toBuffer()

    const mimeTypes: Record<string, string> = {
      webp: 'image/webp',
      jpeg: 'image/jpeg',
      png: 'image/png',
      avif: 'image/avif',
    }

    return new NextResponse(new Uint8Array(output), {
      headers: {
        'Content-Type': mimeTypes[format] || 'image/webp',
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-Image-Transformed': 'true',
      },
    })
  } catch (err: any) {
    console.error('[image-transform] sharp processing error:', err.message)
    return new NextResponse(JSON.stringify({ error: 'Image processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
