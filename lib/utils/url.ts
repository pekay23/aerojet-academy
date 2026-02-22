/**
 * Utility to get the base URL of the application.
 * Handles local development, Vercel preview environments, and production.
 */
export function getBaseUrl() {
  // 1. Explicitly configured app URL (highest priority)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '') // Remove trailing slash
  }

  // 2. Vercel automatically sets VERCEL_URL in its environments
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // VERCEL_URL is also available server-side without the prefix
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 3. Fallback for local development
  return 'http://localhost:3000'
}
