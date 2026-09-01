import 'server-only'
import { headers } from 'next/headers'

export async function getRequestContext(): Promise<{ ipAddress?: string; userAgent?: string }> {
  try {
    const h = await headers()
    return {
      ipAddress: h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('true-client-ip') || undefined,
      userAgent: h.get('user-agent') || undefined,
    }
  } catch {
    return {}
  }
}
