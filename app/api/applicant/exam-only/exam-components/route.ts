import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { filterForStudentTargets, getStudentTargetCategoryCodes } from '@/lib/easa/category-selection'
import { withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  const user = await requireApplicant()

  const [targetCategories, examComponents] = await Promise.all([
    getStudentTargetCategoryCodes(prismaUnfiltered, user.id),
    prismaUnfiltered.examComponent.findMany({
      where: {
        course: {
          isActive: true,
        },
      },
      include: {
        course: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        course: {
          code: 'asc',
        },
      },
      take: 500,
    }),
  ])

  const eligibleComponents = filterForStudentTargets(examComponents, targetCategories)

  return NextResponse.json(
    eligibleComponents.map((ec) => ({
      id: ec.id,
      code: ec.code,
      name: ec.name,
      type: ec.type,
      duration: ec.duration,
      questionCount: ec.questionCount,
      categoryCode: ec.categoryCode,
      individualPrice: Number(ec.individualPrice || 520),
      poolPrice: Number(ec.poolPrice || 300),
      course: {
        code: ec.course.code,
        name: ec.course.name,
      },
    }))
  )
})
