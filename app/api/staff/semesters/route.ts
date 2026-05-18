import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff()
    const { name, academicYearId, startDate, endDate, isActive } = await req.json()

    if (!name || !academicYearId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, Academic Year, start date, and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 })
    }

    const academicYear = await prismaUnfiltered.academicYear.findUnique({
      where: { id: academicYearId },
    })

    if (!academicYear) {
      return NextResponse.json({ error: 'Academic Year not found' }, { status: 404 })
    }

    if (start < academicYear.startDate || end > academicYear.endDate) {
      return NextResponse.json(
        { error: 'Semester dates must fall within the Academic Year dates' },
        { status: 400 }
      )
    }

    const semester = await prismaUnfiltered.semester.create({
      data: {
        name,
        academicYearId,
        startDate: start,
        endDate: end,
        isActive: isActive ?? true,
      },
      include: {
        _count: { select: { classes: true } },
      },
    })

    await createAuditLog({
      action: 'SYSTEM_UPDATE',
      entity: 'semesters',
      entityId: semester.id,
      userId: staff.id,
      description: `Created Semester: ${name} under ${academicYear.name}`,
    })

    revalidateTag('semesters', 'max')
    return NextResponse.json(semester, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create semester:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
