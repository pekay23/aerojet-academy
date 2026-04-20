import { cache } from 'react'
import { getAuthSession } from './helpers'

/**
 * Request-scoped session fetcher.
 * Uses React.cache to ensure getAuthSession is only called once per request,
 * even if multiple Prisma queries trigger the RLS extension in parallel.
 * This significantly reduces database connection pressure and eliminates recursion.
 */
export const getCachedSession = cache(async () => {
  try {
    return await getAuthSession()
  } catch (err) {
    console.error('Error fetching cached session for RLS:', err)
    return null
  }
})
