import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { withErrorHandler , RouteContext } from '@/lib/api/response'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    const id = (await ctx!.params).id

    const course = await prisma.course.findUnique({
      where: { id },
      select: { name: true },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ name: course.name })
  }
)
