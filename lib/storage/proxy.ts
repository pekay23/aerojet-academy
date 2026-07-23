import 'server-only'

/**
 * Storage adapter interface for the image proxy.
 *
 * Supports fetching remote files by URL (UploadThing / any HTTP source)
 * and can be extended for Cloudflare R2 / S3 signed URLs in the future.
 */
export interface StorageAdapter {
  /** Human-readable name for logging */
  name: string
  /**
   * Fetch a file from storage and return its bytes + content type.
   * Throw on failure — the caller handles 404/500.
   */
  fetch(url: string): Promise<{ data: ArrayBuffer; contentType: string }>
}

// ── UploadThing / generic HTTP adapter ──

export const httpAdapter: StorageAdapter = {
  name: 'http',
  async fetch(url: string) {
    const res = await fetch(url, {
      // Use a short timeout so the API route doesn't hang
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url}`)
    }
    const data = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    return { data, contentType }
  },
}

// ── Cloudflare R2 / S3-compatible adapter (future) ──
// To enable: set STORAGE_ADAPTER=s3, install @aws-sdk/client-s3, and configure AWS_* env vars.
//
// export const s3Adapter: StorageAdapter = {
//   name: 's3',
//   async fetch(key: string) {
//     const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
//     const client = new S3Client({ region: process.env.S3_REGION || 'auto' })
//     const cmd = new GetObjectCommand({
//       Bucket: process.env.S3_BUCKET!,
//       Key: key,
//     })
//     const { Body, ContentType } = await client.send(cmd)
//     const bytes = await Body!.transformToByteArray()
//     return { data: bytes.buffer as ArrayBuffer, contentType: ContentType || 'application/octet-stream' }
//   },
// }

// ── Active adapter selection ──

export function getStorageAdapter(): StorageAdapter {
  const adapter = process.env.STORAGE_ADAPTER || 'http'
  switch (adapter) {
    // case 's3': return s3Adapter
    default:
      return httpAdapter
  }
}
