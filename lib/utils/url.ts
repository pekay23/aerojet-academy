import { headers } from 'next/headers'

/**
 * Utility to get the base URL of the application.
 * Handles local development, Vercel preview environments, and production.
 */
export async function getBaseUrl() {
  // 1. Try to get from request headers (server-side only)
  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const proto =
      headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')

    if (host) {
      return `${proto}://${host}`
    }
  } catch (e) {
    // Falls through to static env vars if called outside request context (e.g. client or build)
  }

  // 2. Explicitly configured app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }

  // 3. Vercel automatically sets VERCEL_URL in its environments
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 4. Fallback for local development
  return 'http://localhost:3000'
}
