import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'
import { ExamAttendanceStatus } from '@prisma/client'
import { markExamAttendance } from '@/lib/exams/attendance'

export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff()

    const { membershipId, bookingId, sittingId } = await req.json()

    if (!membershipId && !bookingId && !sittingId) {
      return NextResponse.json(
        { error: 'Must provide either membershipId, bookingId, or sittingId' },
        { status: 400 }
      )
    }

    const result = await markExamAttendance({
      membershipId,
      bookingId,
      sittingId,
      status: ExamAttendanceStatus.ABSENT,
      notes: 'Marked as no-show by staff',
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
        sittingId: result.sittingId,
        status: 'ABSENT',
        reason: 'Staff marked as NO-SHOW',
      },
    })

    revalidatePath('/staff/exams')
    revalidatePath('/student/exams')
    if (result.poolId) revalidatePath(`/staff/exams/pools/${result.poolId}`)
    if (result.eventId) revalidatePath(`/staff/exams/events/${result.eventId}`)
    if (result.userId) revalidatePath(`/staff/students/${result.userId}`)

    return NextResponse.json({ success: true, message: 'Successfully marked as NO_SHOW' })
  } catch (error: any) {
    console.error('Mark NO-SHOW error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
