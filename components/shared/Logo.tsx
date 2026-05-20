import Image from 'next/image'

/**
 * Shared Aerojet Academy wordmark. Centralises the aspect-ratio handling
 * that caused hydration / layout warnings when each entry point declared
 * its own next/image config.
 *
 * The source asset is 700×156 (≈ 4.49 : 1). We pass that as the intrinsic
 * width/height so Next.js can compute the aspect ratio at build time, and
 * size via `className` only — no inline `style={{ width: 'auto', height: 'auto' }}`
 * (which fights the intrinsic ratio and triggers the warning).
 *
 * Default tone is dark-on-light (`onWhite`). Pass `tone="onDark"` for
 * surfaces darker than ivory.
 */
export interface LogoProps {
  /** Tailwind height class, e.g. `h-8`, `h-10`, `h-12`. Width auto-derives. */
  className?: string
  /** Background context. Switches between the light + dark variants. */
  tone?: 'onWhite' | 'onDark'
  /** Disables LCP priority hinting — set when the logo is below the fold. */
  priority?: boolean
}

const SRC = {
  onWhite: '/images/logos/AATA_logo_hor_onWhite.webp',
  onDark: '/images/logos/ATA_logo_hor_onDark.webp',
} as const

const INTRINSIC_WIDTH = 700
const INTRINSIC_HEIGHT = 156

export default function Logo({
  className = 'h-10 w-auto',
  tone = 'onWhite',
  priority = false,
}: LogoProps) {
  return (
    <Image
      src={SRC[tone]}
      alt="Aerojet Academy"
      width={INTRINSIC_WIDTH}
      height={INTRINSIC_HEIGHT}
      priority={priority}
      className={className}
    />
  )
}
