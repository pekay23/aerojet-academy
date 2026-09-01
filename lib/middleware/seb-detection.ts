import { SEB } from '@/lib/constants/business-rules'

export function isSEBRequest(req: Request): boolean {
  const requestHash = req.headers.get('x-safeexambrowser-requesthash')
  if (!requestHash) return false
  if (!SEB.BROWSER_EXAM_KEY) return false
  return requestHash === SEB.BROWSER_EXAM_KEY
}
