'use client'

import Image from 'next/image'
import { type ComponentProps, useCallback } from 'react'

type ProtectedImageProps = Omit<
  ComponentProps<typeof Image>,
  'onContextMenu' | 'onDragStart' | 'draggable'
> & {
  /**
   * When true, adds an invisible overlay on top of the image to block
   * right-click and inspect-element access to the underlying <img> tag.
   * Default: true
   */
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
 * Usage:
 * ```tsx
 * <ProtectedImage
 *   src="/api/images/proxy?path=students/abc/cert.jpg"
 *   alt="Certificate"
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
