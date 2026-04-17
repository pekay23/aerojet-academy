import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'

export async function GET(req: NextRequest) {
  try {
    const session = await requireStaff()

    const academicYears = await prisma.academicYear.findMany({
      include: {
        semesters: {
          orderBy: { startDate: 'asc' },
        },
        _count: {
          select: { classes: true },
        },
      },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(academicYears)
  } catch (error: any) {
    console.error('Failed to fetch academic years:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff()
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

    const existing = await prisma.academicYear.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json(
        { error: 'An Academic Year with this name already exists' },
        { status: 400 }
      )
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        isActive: isActive ?? true,
      },
    })

    await createAuditLog({
      action: 'SYSTEM_UPDATE',
      entity: 'academic_years',
      entityId: academicYear.id,
      userId: staff.id,
      description: `Created Academic Year: ${name}`,
    })

    return NextResponse.json(academicYear, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create academic year:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
