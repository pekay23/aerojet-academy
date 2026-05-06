import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff()
    const { id } = await params
    const { name, startDate, endDate, isActive } = await req.json()

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, start date, and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 })
    }

    const existingSemester = await prismaUnfiltered.semester.findUnique({
      where: { id },
      include: { academicYear: true },
    })

    if (!existingSemester) {
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 })
    }

    const { academicYear } = existingSemester
    if (start < academicYear.startDate || end > academicYear.endDate) {
      return NextResponse.json(
        { error: 'Semester dates must fall within the Academic Year dates' },
        { status: 400 }
      )
    }

    const updatedSemester = await prismaUnfiltered.semester.update({
      where: { id },
      data: {
        name,
        startDate: start,
        endDate: end,
        isActive,
      },
      include: {
        _count: { select: { classes: true } },
      },
    })

    await createAuditLog({
      action: 'SYSTEM_UPDATE',
      entity: 'semesters',
      entityId: id,
      userId: staff.id,
      description: `Updated Semester: ${name}`,
    })

    return NextResponse.json(updatedSemester)
  } catch (error: any) {
    console.error('Failed to update semester:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff()
    const { id } = await params

    const existingSemester = await prismaUnfiltered.semester.findUnique({
      where: { id },
      include: {
        _count: { select: { classes: true } },
      },
    })

    if (!existingSemester) {
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 })
    }

    if (existingSemester._count.classes > 0) {
      return NextResponse.json(
        { error: 'Cannot delete Semester containing Classes.' },
        { status: 400 }
      )
    }

    await prismaUnfiltered.semester.delete({ where: { id } })

    await createAuditLog({
      action: 'SYSTEM_UPDATE',
      entity: 'semesters',
      entityId: id,
      userId: staff.id,
      description: `Deleted Semester: ${existingSemester.name}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete semester:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
