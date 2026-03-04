import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import {
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail,
  sendSeatReservationConfirmedEmail,
  sendActivationEmail,
} from '@/lib/email/service'
import {
  hashPassword,
  generateToken,
  generateTempPassword,
  generateAcademyEmail,
} from '@/lib/auth/helpers'
import { PaymentStatus, ProgrammeChoice } from '@prisma/client'
import { topUpWallet } from '@/lib/wallet/operations'
import { shouldPromoteOnPayment, promoteApplicantToStudent } from '@/lib/enrollment/pathway'
import { generateMilestonesForYear } from '@/lib/enrollment/full-time'

/** Maps ProgrammeChoice enum to FullTimeProgramme.code */
const PROGRAMME_CODE_MAP: Record<string, string> = {
  FULL_TIME_4YEAR: 'FT_4Y_B1B2',
  FULL_TIME_2YEAR: 'FT_2Y_B1',
  MILITARY_1YEAR: 'MIL_1Y_B1',
}

// POST /api/staff/payments/[id]/approve — Approve or reject a payment
export const POST = withErrorHandler(
  async (req: NextRequest, context: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id

    if (!id) return apiError('Payment ID required')

    let body: any
    try {
      body = await req.json()
    } catch (e) {
      return apiError('Invalid request body', 400)
    }

    const { action, notes, reason } = body
    if (!['approve', 'reject'].includes(action)) {
      return apiError('Action must be "approve" or "reject"')
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: { include: { profile: true } } },
    })

    if (!payment) return apiNotFound('Payment not found')
    if (payment.status !== 'PENDING') return apiError(`Payment is already ${payment.status}`)

    if (action === 'approve') {
      await prisma.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.APPROVED,
          approvedBy: staff.id,
          approvedAt: new Date(),
          notes,
        },
      })

      // Handle Wallet Top-up
      if (payment.referenceType === 'WALLET_TOPUP') {
        const topUpReference = payment.referenceCode || `PAY-${payment.id.slice(-6)}`
        await prisma.$transaction(async (tx) => {
          // If Wallet doesn't exist yet (APPLICANT topping up for the first time), create it
          let wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } })
          if (!wallet) {
            wallet = await tx.wallet.create({
              data: {
                userId: payment.userId,
                balance: 0,
                reservedBalance: 0,
                availableBalance: 0,
              },
            })
          }

          await topUpWallet(
            tx,
            payment.userId,
            Number(payment.amount),
            `Wallet top-up approved (Ref: ${topUpReference})`,
            payment.id,
            'PAYMENT_ID'
          )
        })
      }

      // Handle Course Enrollment (Modular)
      if (payment.referenceType === 'COURSE' && payment.referenceId) {
        await prisma.enrollment.update({
          where: {
            userId_courseId: {
              userId: payment.userId,
              courseId: payment.referenceId,
            },
          },
          data: {
            status: 'ENROLLED',
            approvedAt: new Date(),
            amountPaid: payment.amount,
          },
        })
      }

      // Handle Full-Time enrollment creation + milestone tracking on seat-related payments
      const isFTPayment = [
        'SEAT_CONFIRMATION',
        'CUSTOM_PART_PAYMENT',
        'YEAR_1_FULL',
        'FULL_PROGRAMME',
      ].includes(payment.referenceType || '')
      const isFTApplicant =
        payment.user.role === 'APPLICANT' &&
        payment.user.status === 'ACTIVE' &&
        payment.user.programmeChoice &&
        PROGRAMME_CODE_MAP[payment.user.programmeChoice]

      if (isFTPayment && isFTApplicant) {
        const programmeCode = PROGRAMME_CODE_MAP[payment.user.programmeChoice!]
        const programme = await prisma.fullTimeProgramme.findUnique({
          where: { code: programmeCode },
          include: { programmeYears: { where: { yearNumber: 1 } } },
        })

        if (programme && programme.programmeYears.length > 0) {
          const year1 = programme.programmeYears[0]

          // Create FullTimeEnrollment if it doesn't exist yet
          let enrollment = await prisma.fullTimeEnrollment.findFirst({
            where: { studentId: payment.userId, programmeId: programme.id },
          })

          if (!enrollment) {
            enrollment = await prisma.fullTimeEnrollment.create({
              data: {
                studentId: payment.userId,
                programmeId: programme.id,
                programmeYearId: year1.id,
                status: 'PENDING_CONFIRMATION',
                currentYearNumber: 1,
                academicYear: '2026/2027',
              },
            })

            // Generate Year 1 milestones (40/30/30)
            await generateMilestonesForYear(enrollment.id, year1.id)
          }

          // Mark milestones based on payment type
          const milestones = await prisma.paymentMilestone.findMany({
            where: { enrollmentId: enrollment.id, yearNumber: 1 },
            orderBy: { createdAt: 'asc' },
          })

          if (
            payment.referenceType === 'SEAT_CONFIRMATION' ||
            payment.referenceType === 'CUSTOM_PART_PAYMENT'
          ) {
            // Mark SEAT_CONFIRMATION milestone as PAID
            const seatMs = milestones.find((m) => m.milestoneType === 'SEAT_CONFIRMATION')
            if (seatMs && seatMs.status !== 'PAID') {
              await prisma.paymentMilestone.update({
                where: { id: seatMs.id },
                data: { status: 'PAID', paidAt: new Date() },
              })
            }

            // For CUSTOM_PART_PAYMENT: if amount > seat fee, apply excess to SEM1_DUE via wallet
            if (payment.referenceType === 'CUSTOM_PART_PAYMENT' && seatMs) {
              const seatAmount = Number(seatMs.amountDue)
              const paidAmount = Number(payment.amount)
              const excess = paidAmount - seatAmount

              if (excess > 0) {
                // Credit excess to wallet for future milestone payments
                await prisma.$transaction(async (tx) => {
                  let wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } })
                  if (!wallet) {
                    wallet = await tx.wallet.create({
                      data: {
                        userId: payment.userId,
                        balance: 0,
                        reservedBalance: 0,
                        availableBalance: 0,
                      },
                    })
                  }
                  await topUpWallet(
                    tx,
                    payment.userId,
                    excess,
                    `Excess from custom part payment credited to wallet`,
                    payment.id,
                    'PAYMENT_ID'
                  )
                })
              }
            }

            // Update enrollment status
            await prisma.fullTimeEnrollment.update({
              where: { id: enrollment.id },
              data: { status: 'ACTIVE' },
            })

            // Send seat reservation confirmation email
            if (payment.user.profile) {
              const programmeName =
                programme?.name || payment.user.programmeChoice || 'Your Programme'
              sendSeatReservationConfirmedEmail(
                payment.user.email,
                payment.user.profile.firstName,
                programmeName,
                Number(payment.amount),
                payment.currency || 'EUR'
              ).catch(console.error)
            }
          }
        }
      }

      // Promote APPLICANT → STUDENT if payment type satisfies pathway conditions
      // (YEAR_1_FULL and FULL_PROGRAMME promote immediately; SEAT_CONFIRMATION does NOT)
      if (
        payment.user.role === 'APPLICANT' &&
        payment.user.status === 'ACTIVE' &&
        payment.referenceType &&
        shouldPromoteOnPayment(payment.user.programmeChoice, payment.referenceType)
      ) {
        await promoteApplicantToStudent(payment.userId, staff.id)
      }

      // Qualify any pending referral for this user (non-blocking)
      import('@/lib/referral/operations')
        .then(({ qualifyReferral }) => qualifyReferral(payment.userId))
        .catch(console.error)

      // Handle REGISTRATION payment - send activation email with credentials
      if (payment.referenceType === 'REGISTRATION' && payment.user.profile) {
        const profile = payment.user.profile

        // Only generate credentials if user is still PENDING (not yet activated)
        if (payment.user.status === 'PENDING') {
          const tempPassword = generateTempPassword()
          const hashedTempPassword = await hashPassword(tempPassword)
          const verifyToken = generateToken()
          const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
          const academyEmail = await generateAcademyEmail(
            profile.firstName,
            profile.middleName || undefined,
            profile.lastName
          )

          // Update user with credentials and activate
          await prisma.user.update({
            where: { id: payment.userId },
            data: {
              status: 'ACTIVE',
              email: academyEmail,
              academyEmail,
              password: hashedTempPassword,
              verifyToken,
              verifyTokenExpires,
              mustChangePassword: true,
              paymentApprovedAt: new Date(),
              paymentApprovedBy: staff.id,
              registrationPaid: true,
            },
          })

          // Send activation email
          await sendActivationEmail(
            payment.user.email,
            profile.firstName,
            academyEmail,
            tempPassword,
            verifyToken
          )
        }
      } else if (payment.user.profile) {
        // Send payment approved email
        sendPaymentApprovedEmail(
          payment.user.email,
          payment.user.profile.firstName,
          payment.referenceType || 'Payment',
          Number(payment.amount)
        ).catch(console.error)

        if (payment.user.academyEmail) {
          sendPaymentApprovedEmail(
            payment.user.academyEmail,
            payment.user.profile.firstName,
            payment.referenceType || 'Payment',
            Number(payment.amount)
          ).catch(console.error)
        }
      }

      await createAuditLog({
        action: AuditAction.PAYMENT_APPROVE,
        entity: 'Payment',
        entityId: id,
        userId: staff.id,
        details: {
          targetUserId: payment.userId,
          amount: payment.amount,
          type: payment.referenceType,
        },
      })

      return apiSuccess({ message: 'Payment approved' })
    } else {
      if (!reason) return apiError('Rejection reason is required')

      await prisma.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.REJECTED,
          rejectedBy: staff.id,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      })

      if (payment.user.profile) {
        // Send payment rejected email
        sendPaymentRejectedEmail(
          payment.user.email,
          payment.user.profile.firstName,
          payment.referenceType || 'Payment',
          reason
        ).catch(console.error)

        if (payment.user.academyEmail) {
          sendPaymentRejectedEmail(
            payment.user.academyEmail,
            payment.user.profile.firstName,
            payment.referenceType || 'Payment',
            reason
          ).catch(console.error)
        }
      }

      await createAuditLog({
        action: AuditAction.PAYMENT_REJECT,
        entity: 'Payment',
        entityId: id,
        userId: staff.id,
        details: { targetUserId: payment.userId, reason },
      })

      return apiSuccess({ message: 'Payment rejected' })
    }
  }
)
