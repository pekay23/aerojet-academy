import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'

/** GET — read current user's privacy toggles. */
export const GET = withErrorHandler(async () => {
  const user = await requireAuth()
  const row = await prismaUnfiltered.user.findUnique({
    where: { id: user.id },
    select: { showLastSeen: true },
  })
  return apiSuccess({ showLastSeen: row?.showLastSeen ?? false })
})

const schema = z.object({
  showLastSeen: z.boolean(),
})

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth()
  const body = schema.parse(await req.json())
  await prismaUnfiltered.user.update({
    where: { id: user.id },
    data: { showLastSeen: body.showLastSeen },
  })
  return apiSuccess({ showLastSeen: body.showLastSeen })
})
