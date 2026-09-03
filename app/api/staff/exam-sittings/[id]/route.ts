import { NextRequest, NextResponse } from 'next/server'
import { SessionType, SittingStatus, Prisma } from '@prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireStaff()
    const { id } = await params

    const sitting = await prismaUnfiltered.examSitting.findUnique({
      where: { id },
      include: {
        examComponent: { include: { course: true } },
        examiner: { include: { user: { select: { name: true, email: true } } } },
        assignments: {
          where: { status: { notIn: ['CANCELLED'] } },
          include: {
            user: { select: { id: true, name: true, email: true } },
            booking: {
              select: {
                id: true,
                moduleCode: true,
                bookingType: true,
                guaranteedSeat: true,
                demandStatus: true,
              },
            },
          },
          orderBy: { assignedAt: 'asc' },
        },
      },
    })

    if (!sitting) {
      return NextResponse.json({ error: 'Sitting not found' }, { status: 404 })
    }

    return NextResponse.json({ sitting })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch sitting' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const staff = await requireStaff()
    const { id } = await params
    const body = await req.json()

    const sitting = await prismaUnfiltered.examSitting.findUnique({
      where: { id },
      select: { id: true, eventId: true, dayNumber: true, sessionType: true, status: true },
    })

    if (!sitting) {
      return NextResponse.json({ error: 'Sitting not found' }, { status: 404 })
    }

    // Build update payload from whitelisted fields only
    const data: Record<string, unknown> = {}

    if (typeof body.dayNumber === 'number' && body.dayNumber >= 1) {
      data.dayNumber = body.dayNumber
    }
    if (
      typeof body.sessionType === 'string' &&
      Object.values(SessionType).includes(body.sessionType as SessionType)
    ) {
      data.sessionType = body.sessionType as SessionType
    }
    if (typeof body.capacity === 'number' && body.capacity >= 1) {
      data.capacity = body.capacity
    }
    if (typeof body.venue === 'string') {
      data.venue = body.venue.trim() || null
    }
    if (typeof body.notes === 'string') {
      data.notes = body.notes.trim() || null
    }
    if (
      typeof body.status === 'string' &&
      Object.values(SittingStatus).includes(body.status as SittingStatus)
    ) {
      data.status = body.status as SittingStatus
    }
    if (body.startTime) {
      const parsed = new Date(body.startTime)
      if (!isNaN(parsed.getTime())) data.startTime = parsed
    }
    if (body.endTime) {
      const parsed = new Date(body.endTime)
      if (!isNaN(parsed.getTime())) data.endTime = parsed
    }
    if (typeof body.examinerId === 'string') {
      data.examinerId = body.examinerId || null
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await prismaUnfiltered.examSitting.update({
      where: { id },
      data,
    })

    await createAuditLog({
      action: 'UPDATE',
      entity: 'ExamSitting',
      entityId: id,
      userId: staff.id,
      details: { changes: data as Prisma.InputJsonValue, eventId: sitting.eventId },
    })

    revalidatePath(`/staff/exams/events/${sitting.eventId}`)
    revalidatePath('/staff/exams')

    return NextResponse.json({ success: true, sitting: updated })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update sitting' },
      { status: 500 }
    )
  }
}
