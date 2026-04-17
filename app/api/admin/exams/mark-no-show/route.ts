import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized or insufficient permissions' },
        { status: 403 }
      )
    }

    const { membershipId, bookingId } = await req.json()

    if (!membershipId && !bookingId) {
      return NextResponse.json(
        { error: 'Must provide either membershipId or bookingId' },
        { status: 400 }
      )
    }

    if (membershipId) {
      const membership = await prisma.poolMembership.findUnique({ where: { id: membershipId } })
      if (!membership)
        return NextResponse.json({ error: 'Pool membership not found' }, { status: 404 })

      await prisma.poolMembership.update({
        where: { id: membershipId },
        data: { status: 'NO_SHOW' },
      })

      await createAuditLog({
        action: 'UPDATE',
        entity: 'PoolMembership',
        entityId: membershipId,
        userId: session.user.id,
        details: {
          previousStatus: membership.status,
          newStatus: 'NO_SHOW',
          reason: 'Admin marked as NO-SHOW',
        },
      })
    }

    if (bookingId) {
      const booking = await prisma.examBooking.findUnique({ where: { id: bookingId } })
      if (!booking) return NextResponse.json({ error: 'Exam booking not found' }, { status: 404 })

      await prisma.examBooking.update({
        where: { id: bookingId },
        data: { status: 'NO_SHOW' },
      })

      await createAuditLog({
        action: 'UPDATE',
        entity: 'ExamBooking',
        entityId: bookingId,
        userId: session.user.id,
        details: {
          previousStatus: booking.status,
          newStatus: 'NO_SHOW',
          reason: 'Admin marked as NO-SHOW',
        },
      })
    }

    return NextResponse.json({ success: true, message: 'Successfully marked as NO_SHOW' })
  } catch (error: any) {
    console.error('Mark NO-SHOW error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
