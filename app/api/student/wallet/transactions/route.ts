import { NextRequest } from 'next/server'
import { requireStudent } from '@/lib/auth/helpers'
import { apiPaginated, withErrorHandler } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'
import { getTransactions } from '@/lib/wallet/operations'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)
  const type = searchParams.get('type') as any

  const { transactions, total } = await getTransactions(user.id, { type, limit, offset: skip })
  return apiPaginated(transactions, total, page, limit)
})

