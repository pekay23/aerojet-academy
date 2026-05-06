import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/staff/students/[id]/book-exam
 *
 * Admin books exam(s) on behalf of a student.
 * Supports: INDIVIDUAL, TWIN_PACK, FOUR_PACK, RESIT booking types.
 * Payment: AUTO_DEBIT (wallet debit now) or MANUAL_LATER (create pending booking).
 */
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const studentId = context?.params?.id
    if (!studentId) return apiError('Student ID required')

    const body = await req.json()
    const { bookingType, moduleIds, eventId, examDate, paymentMethod, notes, attemptType } =
      body as {
        bookingType: 'INDIVIDUAL' | 'TWIN_PACK' | 'FOUR_PACK' | 'RESIT'
        moduleIds: string[]
        eventId?: string
        examDate?: string
        paymentMethod: 'AUTO_DEBIT' | 'MANUAL_LATER'
        notes?: string
        attemptType?: string
      }

    // Validate booking type
    const validTypes = ['INDIVIDUAL', 'TWIN_PACK', 'FOUR_PACK', 'RESIT']
    if (!validTypes.includes(bookingType)) {
      return apiError('Invalid booking type')
    }

    // Validate module count per booking type
    const expectedModules: Record<string, number> = {
      INDIVIDUAL: 1,
      TWIN_PACK: 2,
      FOUR_PACK: 4,
      RESIT: 1,
    }
    if (!moduleIds || moduleIds.length !== expectedModules[bookingType]) {
      return apiError(
        `${bookingType} requires exactly ${expectedModules[bookingType]} module(s). Got ${moduleIds?.length ?? 0}.`
      )
    }

    // Verify student exists
    const student = await prismaUnfiltered.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
      include: { profile: true },
    })
    if (!student) return apiError('Student not found')

    // Fetch pricing
    const pricing = await getExamPricingConfig()
    const priceMap: Record<string, number> = {
      INDIVIDUAL: pricing.individualExamFee,
      TWIN_PACK: pricing.twoSeatBundle,
      FOUR_PACK: pricing.fourSeatBundle,
      RESIT: pricing.resitExamFee,
    }
    const totalPrice = priceMap[bookingType]

    // Resolve exam components from IDs (moduleIds are ExamComponent IDs)
    const components = await prismaUnfiltered.examComponent.findMany({
      where: { id: { in: moduleIds } },
      include: { course: true },
    })
    if (components.length !== moduleIds.length) {
      return apiError('One or more invalid module IDs')
    }

    // Resolve exam date
    let resolvedExamDate: Date | null = examDate ? new Date(examDate) : null

    // If event specified, try to use event start date
    if (eventId && !resolvedExamDate) {
      const event = await prismaUnfiltered.examEvent.findUnique({ where: { id: eventId } })
      if (event) resolvedExamDate = event.startDate
    }

    if (!resolvedExamDate) {
      return apiError('Exam date is required (either directly or via an exam event)')
    }

    // Perform the booking in a transaction
    const result = await prismaUnfiltered.$transaction(async (tx) => {
      let walletTxnId: string | null = null

      // Handle wallet debit if AUTO_DEBIT
      if (paymentMethod === 'AUTO_DEBIT') {
        const wallet = await tx.wallet.findUnique({ where: { userId: studentId } })
        if (!wallet) {
          throw new Error(
            'Student wallet not found. Please ensure the student has a wallet before booking. You may need to credit their wallet first via the Wallet tab.'
          )
        }

        const available = Number(wallet.availableBalance)
        if (available < totalPrice) {
          throw new Error(
            `Insufficient wallet balance. Need €${totalPrice.toFixed(2)}, available €${available.toFixed(2)}. ` +
            `Please adjust the student's wallet balance first (Student Profile → Wallet tab → Manual Adjustment), then try booking again.`
          )
        }

        // Use standard chargeWallet() for proper audit trail
        const { chargeWallet } = await import('@/lib/wallet/operations')
        await chargeWallet(
          tx,
          studentId,
          totalPrice,
          `Admin booked ${bookingType.replace(/_/g, ' ')} exam(s): ${components.map((c) => c.code).join(', ')}`,
          `ADMIN_BOOKING_${Date.now()}`,
          'EXAM_BOOKING'
        )

        // Retrieve the wallet transaction ID for linking to bookings
        const latestTxn = await tx.walletTransaction.findFirst({
          where: { wallet: { userId: studentId }, referenceType: 'EXAM_BOOKING' },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        })
        walletTxnId = latestTxn?.id ?? null
      }

      // Create exam bookings
      const bookingGroupRef = moduleIds.length > 1 ? `ADMIN_BUNDLE_${Date.now()}` : undefined

      const createdBookings = []
      for (let i = 0; i < components.length; i++) {
        const comp = components[i]
        const isFirst = i === 0

        const booking = await tx.examBooking.create({
          data: {
            userId: studentId,
            examComponentId: comp.id,
            courseId: comp.courseId,
            moduleCode: comp.course?.code?.toUpperCase() || comp.code,
            examDate: resolvedExamDate!,
            eventId: eventId || undefined,
            amountPaid: isFirst ? totalPrice : 0,
            status: paymentMethod === 'AUTO_DEBIT' ? ('COMPLETED') : ('PENDING'),
            bookingType: bookingType,
            attemptType: attemptType || (bookingType === 'RESIT' ? 'RESIT_1' : 'FIRST'),
            isResit: bookingType === 'RESIT',

            bookingGroupRef,
            walletTxnId: isFirst ? walletTxnId : undefined,
          },
        })
        createdBookings.push(booking)
      }

      // Create notification for student
      await tx.notification.create({
        data: {
          userId: studentId,
          title: 'Exam Booking Created',
          message: `An admin has booked ${components.map((c) => c.code).join(', ')} exam(s) for you${resolvedExamDate ? ` on ${resolvedExamDate.toLocaleDateString('en-GB')}` : ''}. ${paymentMethod === 'AUTO_DEBIT' ? `€${totalPrice} has been debited from your wallet.` : 'Payment is pending.'}`,
          type: 'EXAM_REMINDER',
          sentBy: staff.id,
          linkUrl: '/student/exams',
          linkText: 'View Exams',
        },
      })

      return {
        bookingIds: createdBookings.map((b) => b.id),
        walletTxnId,
        totalPrice,
      }
    })

    // Audit log
    await logAuditEvent({
      userId: staff.id,
      action: 'EXAM_BOOKING_CREATED',
      entity: 'ExamBooking',
      entityId: result.bookingIds[0],
      description: `Admin booked ${bookingType} exam(s) for student ${studentId}: ${components.map((c) => c.code).join(', ')}. Payment: ${paymentMethod}`,
    })

    // Revalidate paths
    revalidatePath('/student')
    revalidatePath('/student/exams')
    revalidatePath('/student/wallet')
    revalidatePath('/student/notifications')
    revalidatePath('/staff/exams')
    revalidatePath(`/staff/students/${studentId}`)

    return apiSuccess({
      success: true,
      bookingIds: result.bookingIds,
      walletTransaction: result.walletTxnId
        ? { id: result.walletTxnId, amount: result.totalPrice }
        : null,
    })
  }
)
