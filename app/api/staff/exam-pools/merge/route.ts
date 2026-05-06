import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { canMergePools, mergePools } from '@/lib/pools/operations'
import { mergePoolsSchema, validateBody } from '@/lib/validation/schemas'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()

  const body = await req.json()
  const validation = validateBody(mergePoolsSchema, body)
  if (!validation.success) return apiError(validation.error)

  const result = await mergePools(validation.data.poolAId, validation.data.poolBId, staff.id)
  return apiSuccess(result)
})

export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const body = await req.json()
  const validation = validateBody(mergePoolsSchema, body)
  if (!validation.success) return apiError(validation.error)

  const result = await canMergePools(validation.data.poolAId, validation.data.poolBId)
  return apiSuccess(result)
})
