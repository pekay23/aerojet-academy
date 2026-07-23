# Image Proxy & Storage Adapter

## Overview

The image proxy system provides auth-gated, role-scoped access to protected images
(UploadThing uploads, student documents, resource files, profile photos) through
authenticated API routes. It prevents direct URL sharing by requiring a valid session
for every image request.

## Architecture

```
Client (browser)
   │
   ├─ public images (hero backgrounds, logos, partner logos)
   │  → served directly from `/public/` via next/image
   │
   └─ protected images (UploadThing uploads, student docs, resources)
      → proxyImageUrl() / transformImageUrl() helpers
         │
         ├─ GET /api/images/proxy      (any authed user)
         │  └─ getStorageAdapter().fetch(url)
         │     └─ httpAdapter (fetch with 10s timeout)
         │
         └─ GET /api/images/transform   (staff only)
            └─ same fetch + sharp processing
               └─ watermark, resize, EXIF strip, format convert
```

## Files

| File                                | Purpose                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `lib/storage/proxy.ts`              | `StorageAdapter` interface + `httpAdapter` + `getStorageAdapter()` selector |
| `lib/storage/signed-url.ts`         | `proxyImageUrl()` and `transformImageUrl()` helper functions                |
| `components/ProtectedImage.tsx`     | `next/image` wrapper with right-click/drag protection                       |
| `app/api/images/proxy/route.ts`     | Auth-gated proxy endpoint                                                   |
| `app/api/images/transform/route.ts` | Staff-only transform endpoint                                               |

## Storage Adapter Interface

```ts
export interface StorageAdapter {
  name: string
  fetch(url: string): Promise<{ data: ArrayBuffer; contentType: string }>
}
```

Active adapter selected via `STORAGE_ADAPTER` env var:

- `'http'` (default) — Plain HTTP fetch with 10s timeout (`AbortSignal.timeout(10_000)`)
- `'s3'` (commented out) — Placeholder for Cloudflare R2 / S3 signed URLs

To add a new adapter: implement the `StorageAdapter` interface, register it in
`getStorageAdapter()`'s switch statement.

### Adding S3/R2 Support

The commented-out `s3Adapter` in `lib/storage/proxy.ts` shows the pattern:

1. Install `@aws-sdk/client-s3`
2. Configure `AWS_*` env vars (region, bucket, credentials)
3. Uncomment and wire the adapter

## URL Helpers

### `proxyImageUrl(imageUrl, scope?, options?)`

Builds a URL for `/api/images/proxy`:

```ts
proxyImageUrl('https://utfs.io/f/abc123.jpg')
// → /api/images/proxy?url=https%3A%2F%2Futfs.io%2Ff%2Fabc123.jpg

proxyImageUrl('https://utfs.io/f/abc123.jpg', 'students', { width: 400, quality: 85 })
// → /api/images/proxy?url=...&scope=students&w=400&q=85
```

### `transformImageUrl(imageUrl, options?)`

Builds a URL for `/api/images/transform` (staff only):

```ts
transformImageUrl('https://utfs.io/f/abc123.jpg', {
  width: 800,
  watermark: true,
  strip: true,
  quality: 90,
  format: 'webp',
})
// → /api/images/transform?url=...&w=800&watermark=true&strip=false&q=90&format=webp
```

## Scope-Based Access Control

| Scope            | Allowed Roles                                                   | Notes                                     |
| ---------------- | --------------------------------------------------------------- | ----------------------------------------- |
| `students`       | SUPER_ADMIN, ADMIN, STAFF, INSTRUCTOR, EXAMINER + own documents | Students can only access their own images |
| `resources`      | SUPER_ADMIN, ADMIN, STAFF, INSTRUCTOR, EXAMINER                 | Teaching materials                        |
| `staff`          | SUPER_ADMIN, ADMIN, STAFF, EXAMINER                             | Staff-only documents                      |
| `profile-photos` | Any authenticated user                                          | Public within the portal                  |
| (no scope)       | Any authenticated user                                          | No additional filtering                   |

## Image Transformation (sharp)

The transform endpoint supports:

- **Resize**: `?w=N` — Max width, maintains aspect ratio, no upscaling
- **Format conversion**: `?format=webp|jpeg|png|avif` (default: webp)
- **Quality**: `?q=1-100` (default: 85)
- **Watermark**: `?watermark=true` — Overlays "© Aerojet Academy" + date in top-left
- **EXIF stripping**: `?strip=false` to preserve metadata (stripped by default)

## ProtectedImage Component

`components/ProtectedImage.tsx` wraps `next/image` with client-side protections:

- Right-click context menu disabled
- Drag-and-drop prevented
- Invisible overlay to block DevTools element inspection (optional, default: on)
- `user-select: none` and `pointer-events: none` on the `<img>` element

```tsx
// Above the fold — preload with priority
<ProtectedImage
  src={proxyImageUrl("https://utfs.io/f/abc.jpg", "students")}
  alt="Certificate"
  width={400}
  height={300}
  priority
/>

// Below the fold — lazy (default)
<ProtectedImage
  src={proxyImageUrl("https://utfs.io/f/def.jpg")}
  alt="Document"
  width={400}
  height={300}
/>
```

## Security

- Both endpoints require a valid NextAuth session
- The proxy endpoint validates optional scope-based permissions
- The transform endpoint additionally requires a staff role
- Response headers: `X-Content-Type-Options: nosniff`, `Cache-Control: private, max-age=3600`
- No direct access to UploadThing URLs from the client — all traffic flows through the proxy

## Performance

- 10s timeout on storage adapter fetches
- 1-hour browser cache (`private, max-age=3600`)
- Sharp processing only when transformation params are provided
- Use `priority` prop for above-the-fold images to enable `<link rel="preload">`
- Use default lazy loading for below-the-fold images
