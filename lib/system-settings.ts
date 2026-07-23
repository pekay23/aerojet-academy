import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

const DEFAULT_REGISTRATION_FEE = { fee: '350', currency: 'GHS' }

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const guardedPromise = promise.catch((error) => {
    console.warn('[system-settings] Database lookup failed:', error)
    return fallback
  })

  try {
    return await Promise.race([
      guardedPromise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn(`[system-settings] Database lookup exceeded ${ms}ms; using defaults.`)
          resolve(fallback)
        }, ms)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

/**
 * Fetches specific system settings from the database.
 * Uses React `cache` to deduplicate queries within a single request,
 * and Next.js `unstable_cache` to persist settings across requests (e.g., for 5 minutes).
 */
export const getSystemSettings = cache(async (keys: string[]) => {
  const fetchSettings = async () => {
    try {
      const settings = await withTimeout(
        prisma.systemSetting.findMany({
          where: { key: { in: keys } },
        }),
        5000,
        []
      )

      // Convert to a record for easier access: { key: value }
      return settings.reduce(
        (acc, s) => {
          acc[s.key] = s.value
          return acc
        },
        {} as Record<string, string>
      )
    } catch (error) {
      console.warn('[system-settings] fetchSettings try-catch fallback triggered:', error)
      return {} as Record<string, string>
    }
  }

  // Bypass unstable_cache during build or production to avoid isolated context env-stripping bugs
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NODE_ENV === 'production'
  ) {
    return fetchSettings()
  }

  return unstable_cache(fetchSettings, [`system-settings-${keys.sort().join('-')}`], {
    revalidate: 300, // Revalidate every 5 minutes
    tags: ['system-settings'],
  })()
})

/**
 * Convenience helper for registration fee info.
 */
export async function getRegistrationFeeInfo() {
  const settings = await getSystemSettings(['registration_fee', 'registration_currency'])
  const fee = settings['registration_fee'] || DEFAULT_REGISTRATION_FEE.fee
  const currency = settings['registration_currency'] || DEFAULT_REGISTRATION_FEE.currency
  return { fee, currency }
}
