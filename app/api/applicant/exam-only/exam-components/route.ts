import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const examComponents = await prisma.examComponent.findMany({
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
    })

    return NextResponse.json(
      examComponents.map((ec) => ({
        id: ec.id,
        code: ec.code,
        name: ec.name,
        type: ec.type,
        duration: ec.duration,
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
