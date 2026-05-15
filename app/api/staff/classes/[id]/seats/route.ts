import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { Prisma } from '@prisma/client'

/**
 * GET: Fetch class details with enrolled students and classroom seating info
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      course: { select: { code: true, name: true } },
      classroom: {
        include: {
          seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
        },
      },
    },
  })

  if (!cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  }

  // Get enrolled students via attendance records (distinct users)
  const attendanceUsers = await prisma.attendanceRecord.findMany({
    where: { classId: id },
    distinct: ['userId'],
    select: {
      userId: true,
      user: {
        include: {
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })

  return NextResponse.json({
    class: cls,
    students: attendanceUsers.map((a) => ({
      userId: a.userId,
      name: a.user.profile
        ? `${a.user.profile.firstName} ${a.user.profile.lastName}`
        : a.user.email,
    })),
  })
}
