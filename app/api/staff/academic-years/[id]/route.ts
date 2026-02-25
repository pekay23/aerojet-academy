import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
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

    // Check unique name constraint ignoring self
    const existing = await prisma.academicYear.findFirst({
      where: { name, id: { not: id } },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Another Academic Year with this name already exists' },
        { status: 400 }
      )
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        name,
        startDate: start,
        endDate: end,
        isActive,
      },
      include: {
        semesters: { orderBy: { startDate: 'asc' } },
        _count: { select: { classes: true } },
      },
    })

    await createAuditLog({
      action: 'SYSTEM_UPDATE' as any,
      entity: 'academic_years',
      entityId: id,
      userId: staff.id,
      description: `Updated Academic Year: ${name}`,
    })

    return NextResponse.json(academicYear)
  } catch (error: any) {
    console.error('Failed to update academic year:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff()
    const { id } = await params

    const academicYear = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        _count: {
          select: { classes: true, semesters: true },
        },
      },
    })

    if (!academicYear) {
      return NextResponse.json({ error: 'Academic Year not found' }, { status: 404 })
    }

    if (academicYear._count.classes > 0) {
      return NextResponse.json(
        { error: 'Cannot delete Academic Year containing Classes.' },
        { status: 400 }
      )
    }

    await prisma.academicYear.delete({ where: { id } })

    await createAuditLog({
      action: 'SYSTEM_UPDATE' as any,
      entity: 'academic_years',
      entityId: id,
      userId: staff.id,
      description: `Deleted Academic Year: ${academicYear.name}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete academic year:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
