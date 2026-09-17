import prisma from '@/lib/prisma/client'
import { chargeWallet } from '@/lib/wallet/operations'
import { getExamPricingConfig } from './pricing-config'
import { logAuditEvent } from '@/lib/audit/logger'

export interface GroupBookingParams {
  repUserId: string
  eventId: string
  groupName: string
  memberCount: number
  modules: string[] // exam component IDs
}

/**
 * Creates a group booking with a dedicated GROUP_CHARTER pool.
 * One representative books and pays the charter fee (default 7500 EUR)
 * for the entire group.
 */
export async function createGroupBooking(params: GroupBookingParams) {
  const { repUserId, eventId, groupName, memberCount, modules } = params

  if (!groupName.trim()) throw new Error('Group/company name is required.')
  if (memberCount < 1) throw new Error('At least 1 member is required.')
  if (!modules.length) throw new Error('At least 1 exam module must be selected.')

  const pricing = await getExamPricingConfig()
  const charterFee = pricing.groupCharterFee

  const event = await prisma.examEvent.findUnique({
    where: { id: eventId },
    select: { id: true, name: true, startDate: true, status: true },
  })
  if (!event) throw new Error('Exam event not found.')
  if (event.status !== 'OPEN' && event.status !== 'DRAFT') {
    throw new Error('This exam event is not accepting bookings.')
  }

  // Resolve exam components
  const components = await prisma.examComponent.findMany({
    where: { id: { in: modules } },
    include: { course: { select: { code: true, name: true } } },
  })
  if (components.length !== modules.length) {
    throw new Error('One or more invalid exam modules selected.')
  }

  return prisma.$transaction(
    async (tx) => {
      // Check wallet balance
      const wallet = await tx.wallet.findUnique({ where: { userId: repUserId } })
      if (!wallet || Number(wallet.availableBalance) < charterFee) {
        throw new Error(
          `Insufficient wallet balance for group charter. Required: €${charterFee.toFixed(2)}`
        )
      }

      // Charge the charter fee
      await chargeWallet(
        tx,
        repUserId,
        charterFee,
        `Group Charter Booking: ${groupName} - ${event.name}`,
        eventId,
        'GROUP_CHARTER'
      )

      // Create dedicated GROUP_CHARTER pool
      const examStartTime = new Date(event.startDate)
      examStartTime.setHours(9, 0, 0, 0)
      const examEndTime = new Date(examStartTime)
      examEndTime.setHours(12, 0, 0, 0)

      const pool = await tx.examPool.create({
        data: {
          eventId,
          name: `Group Charter - ${groupName}`,
          examDate: event.startDate,
          examStartTime,
          examEndTime,
          minCandidates: 1,
          maxCandidates: 28,
          moduleDiversityCap: modules.length,
          status: 'OPEN',
          poolType: 'GROUP_CHARTER',
          dayNumber: 1,
          poolLabel: `GRP-${groupName.substring(0, 8).toUpperCase()}`,
          isAutoPool: false,
          seatPrice: 0, // Covered by charter fee
          allowedModules: components.map((c) => c.course.code),
        },
      })

      // Create the booking record
      const booking = await tx.examBooking.create({
        data: {
          userId: repUserId,
          eventId,
          bookingType: 'GROUP_CHARTER',
          moduleCode: components.map((c) => c.course.code).join(', '),
          amountPaid: charterFee,
          status: 'APPROVED',
          groupRepId: repUserId,
          groupName,
        },
      })

      // Create notification
      await tx.notification.create({
        data: {
          userId: repUserId,
          title: 'Group Charter Booking Created',
          message: `Your group charter for "${groupName}" has been created for ${event.name}. Pool: "${pool.name}". You can now add members.`,
          type: 'SUCCESS',
          linkUrl: '/student/exam-bookings',
          linkText: 'View Bookings',
        },
      })

      await logAuditEvent(
        {
          action: 'GROUP_CHARTER_CREATE',
          entity: 'ExamBooking',
          entityId: booking.id,
          userId: repUserId,
          description: `Group charter created: ${groupName} for event ${event.name}, ${memberCount} members, ${modules.length} modules.`,
        },
        tx
      )

      return { pool, booking }
    },
    { timeout: 15000 }
  )
}
