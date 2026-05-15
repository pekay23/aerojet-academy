import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { z } from 'zod'

const seatAssignmentSchema = z.object({
  assignments: z.array(
    z.object({
      assignmentId: z.string(),
      seatId: z.string().nullable(),
    })
  ),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: sittingId } = await params

  try {
    const json = await req.json()
    const result = seatAssignmentSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.flatten() },
        { status: 400 }
      )
    }

    // Verify sitting exists
    const sitting = await prisma.examSitting.findUnique({
      where: { id: sittingId },
    })
    if (!sitting) {
      return NextResponse.json({ error: 'Sitting not found' }, { status: 404 })
    }

    const { assignments } = result.data

    // Batch update seat assignments
    await prisma.$transaction(
      assignments.map((a) =>
        prisma.examSittingAssignment.update({
          where: { id: a.assignmentId },
          data: { seatId: a.seatId },
        })
      )
    )

    // Return updated assignments
    const updated = await prisma.examSittingAssignment.findMany({
      where: { sittingId },
      include: {
        user: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        seat: true,
      },
      orderBy: { assignedAt: 'asc' },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[SITTING_SEATS_UPDATE]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: sittingId } = await params

  const sitting = await prisma.examSitting.findUnique({
    where: { id: sittingId },
    include: {
      event: { select: { id: true, name: true } },
      examComponent: { select: { id: true, code: true, name: true } },
      assignments: {
        include: {
          user: {
            include: {
              profile: { select: { firstName: true, lastName: true } },
            },
          },
          seat: true,
        },
        orderBy: { assignedAt: 'asc' },
      },
    },
  })

  if (!sitting) {
    return NextResponse.json({ error: 'Sitting not found' }, { status: 404 })
  }

  return NextResponse.json(sitting)
}
