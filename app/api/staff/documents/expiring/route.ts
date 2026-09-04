import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const windowDays = Math.min(Math.max(Number(req.nextUrl.searchParams.get('window')) || 90, 1), 365)

  const now = new Date()
  const future = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000)

  const [documents, licenses] = await Promise.all([
    prismaUnfiltered.studentDocument.findMany({
      where: {
        expiresAt: { not: null, lte: future },
        status: { not: 'ARCHIVED' },
      },
      orderBy: { expiresAt: 'asc' },
      take: 200,
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
            studentProfile: { select: { studentId: true } },
          },
        },
      },
    }),
    prismaUnfiltered.studentLicenseTarget.findMany({
      where: {
        expiresAt: { not: null, lte: future },
      },
      orderBy: { expiresAt: 'asc' },
      take: 200,
      include: {
        studentProfile: {
          select: {
            studentId: true,
            user: {
              select: {
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        licenseCategory: { select: { code: true, name: true } },
      },
    }),
  ])

  return apiSuccess({ documents, licenses, windowDays })
})
