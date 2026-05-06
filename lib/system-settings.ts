import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

/**
 * Fetches specific system settings from the database.
 * Uses React `cache` to deduplicate queries within a single request,
 * and Next.js `unstable_cache` to persist settings across requests (e.g., for 5 minutes).
 */
export const getSystemSettings = cache(async (keys: string[]) => {
  const fetchSettings = async () => {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: keys } },
    })
    
    // Convert to a record for easier access: { key: value }
    return settings.reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)
  }

  // Bypass unstable_cache during build or production to avoid isolated context env-stripping bugs
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production') {
    return fetchSettings()
  }

  return unstable_cache(
    fetchSettings,
    [`system-settings-${keys.sort().join('-')}`],
    {
      revalidate: 300, // Revalidate every 5 minutes
      tags: ['system-settings'],
    }
  )()
})

/**
 * Convenience helper for registration fee info.
 */
export async function getRegistrationFeeInfo() {
  const settings = await getSystemSettings(['registration_fee', 'registration_currency'])
  const fee = settings['registration_fee'] || '350'
  const currency = settings['registration_currency'] || 'GHS'
  return { fee, currency }
}
