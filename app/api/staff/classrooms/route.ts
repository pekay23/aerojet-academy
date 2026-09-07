import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { z } from 'zod'

const createClassroomSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  type: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const json = await req.json()
    const result = createClassroomSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const classroom = await prisma.classroom.create({
      data: result.data,
    })

    return NextResponse.json(classroom)
  } catch (error: unknown) {
    console.error('[CLASSROOM_CREATE]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
