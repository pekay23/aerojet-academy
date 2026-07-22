import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { getStorageAdapter } from '@/lib/storage/proxy'

/**
 * Auth-gated image proxy.
 *
 * Fetches images from UploadThing (or any HTTP-accessible storage) through
 * an authenticated API route. Validates the user's session and optionally
 * checks role-based permissions before returning the image.
 *
 * Query params:
 *   - url:   The UploadThing / remote image URL to proxy (required)
 *   - scope: Optional scope to validate access (e.g. "students", "resources")
 *   - w:     Optional width for resizing (e.g. 400)
 *   - q:     Optional quality 1-100 (default 85)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')
  const scope = searchParams.get('scope')
  const width = searchParams.get('w')
  const quality = Math.min(100, Math.max(1, parseInt(searchParams.get('q') || '85', 10)))

  if (!imageUrl) {
    return new NextResponse(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 1. Authenticate ──
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 2. Scope-based access control ──
  if (scope) {
    const role = session.user.role as string
    const userId = session.user.id

    switch (scope) {
      case 'students':
        if (!['SUPER_ADMIN', 'ADMIN', 'STAFF', 'INSTRUCTOR', 'EXAMINER'].includes(role)) {
          if (!imageUrl.includes(`/students/${userId}/`)) {
            return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            })
          }
        }
        break

      case 'resources':
        if (!['SUPER_ADMIN', 'ADMIN', 'STAFF', 'INSTRUCTOR', 'EXAMINER'].includes(role)) {
          return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        break

      case 'staff':
        if (!['SUPER_ADMIN', 'ADMIN', 'STAFF', 'EXAMINER'].includes(role)) {
          return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        break

      case 'profile-photos':
        // Anyone authenticated can view profile photos
        break

      default:
        return new NextResponse(JSON.stringify({ error: 'Invalid scope' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
    }
  }

  // ── 3. Fetch the image via the active storage adapter ──
  const adapter = getStorageAdapter()
  let data: ArrayBuffer
  let contentType: string

  try {
    const result = await adapter.fetch(imageUrl)
    data = result.data
    contentType = result.contentType
  } catch (err: any) {
    console.error('[image-proxy] fetch error:', err.message)
    return new NextResponse(JSON.stringify({ error: 'Image not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 4. Optionally resize using sharp (if width param provided) ──
  if (width) {
    try {
      const sharp = (await import('sharp')).default
      const buffer = Buffer.from(data)
      const resized = await sharp(buffer)
        .resize({ width: parseInt(width, 10), withoutEnlargement: true })
        .webp({ quality })
        .toBuffer()

      return new NextResponse(new Uint8Array(resized), {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'private, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    } catch {
      // Fall through to return original if sharp fails
    }
  }

  // ── 5. Return the original image ──
  return new NextResponse(data, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
