import { NextRequest, NextResponse } from 'next/server'
import { ExamAttendanceStatus } from '@prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { revalidatePath } from 'next/cache'
import { createAuditLog } from '@/lib/audit/logger'
import { markExamAttendance } from '@/lib/exams/attendance'

export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff()
    const body = await req.json()
    const membershipId = typeof body.membershipId === 'string' ? body.membershipId : undefined
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId : undefined
    const notes = typeof body.notes === 'string' ? body.notes : undefined
    const status = body.status as ExamAttendanceStatus

    if (!Object.values(ExamAttendanceStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid attendance status' }, { status: 400 })
    }

    const result = await markExamAttendance({
      membershipId,
      bookingId,
      status,
      notes,
      recordedBy: staff.id,
    })

    await createAuditLog({
      action: 'UPDATE',
      entity: 'ExamAttendance',
      entityId: result.attendance.id,
      userId: staff.id,
      details: {
        bookingId: result.bookingId,
        membershipId: result.membershipId,
        status,
      },
    })

    revalidatePath('/staff/exams')
    revalidatePath('/student/exams')
    if (result.poolId) revalidatePath(`/staff/exams/pools/${result.poolId}`)
    if (result.userId) {
      revalidatePath(`/staff/students/${result.userId}`)
      revalidatePath(`/staff/users/${result.userId}`)
    }

    return NextResponse.json({ success: true, attendance: result.attendance })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to mark exam attendance' },
      { status: 500 }
    )
  }
}
