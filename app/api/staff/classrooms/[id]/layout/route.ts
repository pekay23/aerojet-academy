import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { z } from 'zod'

const cellSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  type: z.enum(['DESK', 'AISLE', 'OBSTACLE']),
  label: z.string().nullable().optional(),
})

const layoutSchema = z.object({
  rows: z.number().int().min(1).max(30),
  cols: z.number().int().min(1).max(30),
  cells: z.array(cellSchema),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const json = await req.json()
    const result = layoutSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid layout data', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { rows, cols, cells } = result.data

    // Verify classroom exists
    const classroom = await prisma.classroom.findUnique({ where: { id } })
    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 })
    }

    // Save layout JSON and sync Seat records in a transaction
    const deskCells = cells.filter((c) => c.type === 'DESK')

    await prisma.$transaction(async (tx) => {
      // Update classroom layout JSON
      await tx.classroom.update({
        where: { id },
        data: {
          layout: { rows, cols, cells },
          capacity: deskCells.length,
        },
      })

      // Delete existing seats and recreate from layout
      await tx.seat.deleteMany({ where: { classroomId: id } })

      if (deskCells.length > 0) {
        await tx.seat.createMany({
          data: deskCells.map((cell) => ({
            classroomId: id,
            row: cell.row,
            col: cell.col,
            label: cell.label ?? null,
            isEnabled: true,
            type: 'DESK',
          })),
        })
      }
    })

    const updated = await prisma.classroom.findUnique({
      where: { id },
      include: { seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] } },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    console.error('[CLASSROOM_LAYOUT_UPDATE]', error)
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

  const { id } = await params

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: { seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] } },
  })

  if (!classroom) {
    return NextResponse.json({ error: 'Classroom not found' }, { status: 404 })
  }

  return NextResponse.json(classroom)
}
