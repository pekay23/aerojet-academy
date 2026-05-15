import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { filterForStudentTargets, getStudentTargetCategoryCodes } from '@/lib/easa/category-selection'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [targetCategories, examComponents] = await Promise.all([
      getStudentTargetCategoryCodes(prisma, session.user.id),
      prisma.examComponent.findMany({
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
  } catch (error) {
    console.error('Error fetching exam components:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
