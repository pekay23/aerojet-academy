'use client'

import Image from 'next/image'
import { type ComponentProps, useCallback } from 'react'

type ProtectedImageProps = Omit<
  ComponentProps<typeof Image>,
  'onContextMenu' | 'onDragStart' | 'draggable'
> & {
  overlay?: boolean
}

/**
 * ProtectedImage wraps Next.js `Image` with client-side protections:
 *
 * - Disables right-click context menu
 * - Prevents drag-and-drop
 * - Optionally adds an invisible overlay to block DevTools element inspection
 * - Sets `select-none` and `pointer-events-none` on the container
 *
 * Performance:
 * - Pass `loading="eager"` for images above the fold so they load immediately.
 * - Pass `priority` to also preload the image (sets `loading="eager"` + preloads).
 * - Default is `loading="lazy"` (Next.js default).
 *
 * Usage:
 * ```tsx
 * // Above the fold — eager load
 * <ProtectedImage
 *   src={proxyImageUrl("https://utfs.io/f/abc.jpg", "students")}
 *   alt="Certificate"
 *   width={400}
 *   height={300}
 *   loading="eager"
 * />
 *
 * // Below the fold — lazy (default)
 * <ProtectedImage
 *   src={proxyImageUrl("https://utfs.io/f/def.jpg")}
 *   alt="Document"
 *   width={400}
 *   height={300}
 * />
 * ```
 */
export function ProtectedImage({
  overlay = true,
  className = '',
  alt,
  ...imageProps
}: ProtectedImageProps) {
  const preventDefault = useCallback((e: React.MouseEvent | React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div
      className={`relative select-none ${className}`}
      onContextMenu={preventDefault}
      onDragStart={preventDefault}
    >
      <Image
        {...imageProps}
        alt={alt}
        draggable={false}
        onContextMenu={preventDefault}
        onDragStart={preventDefault}
        className="pointer-events-none"
        style={{ ...imageProps.style, userSelect: 'none', WebkitUserSelect: 'none' }}
      />

      {/* Invisible overlay to block DevTools element inspection of the <img> */}
      {overlay && (
        <div
          className="absolute inset-0 z-10"
          style={{ background: 'transparent' }}
          onContextMenu={preventDefault}
          onMouseDown={preventDefault}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
