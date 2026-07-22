/**
 * URL helpers for the auth-gated image proxy.
 *
 * Works with UploadThing URLs (your current storage) and is ready for
 * Cloudflare R2 / S3 URLs when you add them — just pass the full URL.
 *
 * For public images in /public/ (hero backgrounds, partner logos, etc.),
 * these helpers are not needed — they're already served from your domain.
 *
 * Usage:
 * ```tsx
 * // In a client component, proxy a protected UploadThing image:
 * <ProtectedImage
 *   src={proxyImageUrl("https://utfs.io/f/abc123-image.jpg", "students")}
 *   alt="Document"
 *   width={400}
 *   height={300}
 * />
 *
 * // Staff: get a watermarked, resized version:
 * <Image
 *   src={transformImageUrl("https://utfs.io/f/abc123.jpg", { width: 800, watermark: true })}
 *   alt="Resource"
 *   width={800}
 *   height={600}
 * />
 * ```
 */

/**
 * Build a proxy URL for the auth-gated image proxy.
 * Works with UploadThing, S3, or any HTTP URL.
 *
 * @param imageUrl - The full URL to the image (e.g. UploadThing URL)
 * @param scope    - Optional access scope ("students", "resources", "staff", "profile-photos")
 * @param options  - Optional width and quality for server-side resize
 */
export function proxyImageUrl(
  imageUrl: string,
  scope?: string,
  options?: { width?: number; quality?: number }
): string {
  const params = new URLSearchParams({ url: imageUrl })
  if (scope) params.set('scope', scope)
  if (options?.width) params.set('w', String(options.width))
  if (options?.quality) params.set('q', String(options.quality))
  return `/api/images/proxy?${params.toString()}`
}

/**
 * Build a transform URL for the image transformation endpoint.
 * Only accessible by staff roles.
 *
 * @param imageUrl - The full URL to the image
 * @param options  - Transformation options
 */
export function transformImageUrl(
  imageUrl: string,
  options?: {
    width?: number
    watermark?: boolean
    strip?: boolean
    quality?: number
    format?: 'webp' | 'jpeg' | 'png' | 'avif'
  }
): string {
  const params = new URLSearchParams({ url: imageUrl })
  if (options?.width) params.set('w', String(options.width))
  if (options?.watermark) params.set('watermark', 'true')
  if (options?.strip === false) params.set('strip', 'false')
  if (options?.quality) params.set('q', String(options.quality))
  if (options?.format) params.set('format', options.format)
  return `/api/images/transform?${params.toString()}`
}
