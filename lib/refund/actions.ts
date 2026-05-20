'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff, requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { creditToWallet } from '@/lib/wallet/operations'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

/**
 * Audit 5b — staff refund workflow with reason tracking + approval chain.
 * Staff raises a refund (REQUESTED) → staff confirms (STAFF_CONFIRMED) →
 * admin approves, which processes the refund by crediting the student's
 * wallet (PROCESSED). Admin may approve a REQUESTED one directly.
 */

const OPEN = ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'] as const

const ALLOWED_CURRENCIES = ['EUR', 'GHS', 'USD'] as const
type AllowedCurrency = (typeof ALLOWED_CURRENCIES)[number]

export async function requestRefund(input: {
  /** Student user id, academy/personal email, or student ID. */
  student: string
  amount: number
  reason: string
  /** Defaults to the student's wallet currency when omitted. */
  currency?: string
  walletTxnId?: string
  paymentId?: string
  examBookingId?: string
}) {
  try {
    const staff = await requireStaff()
    if (!input.student?.trim()) return { error: 'A student is required.' }
    if (!input.amount || input.amount <= 0) return { error: 'Enter a valid refund amount.' }
    if (!input.reason?.trim()) return { error: 'A refund reason is required.' }
    if (input.currency && !ALLOWED_CURRENCIES.includes(input.currency as AllowedCurrency)) {
      return { error: `Currency must be one of ${ALLOWED_CURRENCIES.join(', ')}.` }
    }

    const q = input.student.trim()
    const target = await prismaUnfiltered.user.findFirst({
      where: {
        OR: [
          { id: q },
          { email: q },
          { academyEmail: q },
          { studentProfile: { studentId: q } },
        ],
      },
      select: { id: true },
    })
    if (!target) return { error: 'No student found for that email / ID.' }

    const wallet = await prismaUnfiltered.wallet.findUnique({
      where: { userId: target.id },
      select: { currency: true },
    })

    const refund = await prismaUnfiltered.refund.create({
      data: {
        userId: target.id,
        amount: input.amount,
        // Explicit override (staff picked from the dropdown) > wallet default > EUR
        currency: (input.currency as AllowedCurrency | undefined) ?? wallet?.currency ?? 'EUR',
        reason: input.reason.trim(),
        walletTxnId: input.walletTxnId || null,
        paymentId: input.paymentId || null,
        examBookingId: input.examBookingId || null,
        requestedById: staff.id,
        status: 'REQUESTED',
      },
    })
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'Refund',
      entityId: refund.id,
      userId: staff.id,
      description: `Refund requested for ${target.id}: ${input.amount}`,
    })
    revalidatePath('/staff/finance/refunds')
    return { success: true }
  } catch (e) {
    console.error('[requestRefund]', e)
    return { error: 'Failed to create refund request.' }
  }
}

export async function staffConfirmRefund(id: string) {
  try {
    const staff = await requireStaff()
    const r = await prismaUnfiltered.refund.findUnique({ where: { id } })
    if (!r) return { error: 'Refund not found.' }
    if (r.status !== 'REQUESTED') return { error: 'Only requested refunds can be confirmed.' }
    await prismaUnfiltered.refund.update({
      where: { id },
      data: { status: 'STAFF_CONFIRMED', staffConfirmedById: staff.id, staffConfirmedAt: new Date() },
    })
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'Refund',
      entityId: id,
      userId: staff.id,
      description: 'Refund confirmed by staff.',
    })
    revalidatePath('/staff/finance/refunds')
    return { success: true }
  } catch (e) {
    console.error('[staffConfirmRefund]', e)
    return { error: 'Failed to confirm refund.' }
  }
}

export async function rejectRefund(id: string, reason: string) {
  try {
    const staff = await requireStaff()
    const r = await prismaUnfiltered.refund.findUnique({ where: { id } })
    if (!r) return { error: 'Refund not found.' }
    if (!OPEN.includes(r.status as (typeof OPEN)[number])) {
      return { error: 'This refund can no longer be rejected.' }
    }
    await prismaUnfiltered.refund.update({
      where: { id },
      data: { status: 'REJECTED', rejectedById: staff.id, rejectedReason: reason?.trim() || null },
    })
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'Refund',
      entityId: id,
      userId: staff.id,
      description: 'Refund rejected.',
    })
    revalidatePath('/staff/finance/refunds')
    return { success: true }
  } catch (e) {
    console.error('[rejectRefund]', e)
    return { error: 'Failed to reject refund.' }
  }
}

/** Admin approval — processes the refund by crediting the student's wallet. */
export async function approveAndProcessRefund(id: string) {
  try {
    const admin = await requireAdmin()
    const r = await prismaUnfiltered.refund.findUnique({ where: { id } })
    if (!r) return { error: 'Refund not found.' }
    if (r.status !== 'REQUESTED' && r.status !== 'STAFF_CONFIRMED') {
      return { error: 'Only requested or staff-confirmed refunds can be approved.' }
    }

    const now = new Date()
    const txnId = await prismaUnfiltered.$transaction(async (tx) => {
      const credited = await creditToWallet(
        tx,
        r.userId,
        Number(r.amount),
        `Refund: ${r.reason}`,
        r.id,
        'REFUND'
      )
      const lastTxn = await tx.walletTransaction.findFirst({
        where: { walletId: credited.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })
      await tx.refund.update({
        where: { id },
        data: {
          status: 'PROCESSED',
          adminApprovedById: admin.id,
          adminApprovedAt: now,
          processedAt: now,
          processedTxnId: lastTxn?.id ?? null,
        },
      })
      return lastTxn?.id ?? null
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'Refund',
      entityId: id,
      userId: admin.id,
      description: `Refund approved & processed for ${r.userId}: ${r.amount}`,
      changes: { processedTxnId: txnId },
    })

    revalidatePath('/staff/finance/refunds')
    revalidatePath(`/staff/students/${r.userId}`)
    revalidatePath('/student/wallet')
    return { success: true }
  } catch (e) {
    console.error('[approveAndProcessRefund]', e)
    return { error: 'Failed to process refund.' }
  }
}
