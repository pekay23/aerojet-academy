'use server'




import { headers } from 'next/headers'





async function getRequestContext() {
  try {
    const h = await headers()
    return {
      ipAddress: h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('true-client-ip') || null,
      userAgent: h.get('user-agent') || null,
    }
  } catch {
    return { ipAddress: null, userAgent: null }
  }
}

export { getRequestContext }
