'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth, requireStaff, requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Prisma, WithdrawalStatus } from '@prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

/**
 * Audit 5e — student withdrawal workflow.
 * Flow: Student or Staff initiates (REQUESTED) → Staff confirms
 * (STAFF_CONFIRMED) → Admin approves (ADMIN_APPROVED → COMPLETED). Admin may
 * also approve a REQUESTED one directly ("or just approval from admin").
 * On final approval: status/flag only — no automatic money movement
 * (refunds go through the separate 5b refund workflow).
 */

const OPEN_STATUSES = ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'] as const

async function hasOpenRequest(userId: string) {
  return prismaUnfiltered.withdrawalRequest.findFirst({
    where: { userId, status: { in: OPEN_STATUSES as unknown as WithdrawalStatus[] } },
    select: { id: true },
  })
}

/** Student requests their own withdrawal. */
export async function requestWithdrawal(reason: string) {
  try {
    const user = await requireAuth()
    if (!reason?.trim()) return { error: 'Please provide a reason for withdrawal.' }
    if (await hasOpenRequest(user.id)) {
      return { error: 'You already have a withdrawal request in progress.' }
    }
    const wr = await prismaUnfiltered.withdrawalRequest.create({
      data: { userId: user.id, reason: reason.trim(), requestedById: user.id, status: 'REQUESTED' },
    })
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'WithdrawalRequest',
      entityId: wr.id,
      userId: user.id,
      description: 'Student requested withdrawal.',
    })
    revalidatePath('/student/withdrawal')
    revalidatePath('/staff/withdrawals')
    return { success: true }
  } catch (e) {
    console.error('[requestWithdrawal]', e)
    return { error: 'Failed to submit withdrawal request.' }
  }
}

/** Staff initiates a withdrawal on a student's behalf. */
export async function staffInitiateWithdrawal(studentUserId: string, reason: string) {
  try {
    const staff = await requireStaff()
    if (!reason?.trim()) return { error: 'A reason is required.' }
    if (await hasOpenRequest(studentUserId)) {
      return { error: 'This student already has a withdrawal request in progress.' }
    }
    const wr = await prismaUnfiltered.withdrawalRequest.create({
      data: {
        userId: studentUserId,
        reason: reason.trim(),
        requestedById: staff.id,
        status: 'REQUESTED',
      },
    })
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'WithdrawalRequest',
      entityId: wr.id,
      userId: staff.id,
      description: `Staff initiated withdrawal for ${studentUserId}.`,
    })
    revalidatePath('/staff/withdrawals')
    return { success: true }
  } catch (e) {
    console.error('[staffInitiateWithdrawal]', e)
    return { error: 'Failed to initiate withdrawal.' }
  }
}

/** Staff confirms a requested withdrawal (intermediate approval). */
export async function staffConfirmWithdrawal(id: string) {
  try {
    const staff = await requireStaff()
    const wr = await prismaUnfiltered.withdrawalRequest.findUnique({ where: { id } })
    if (!wr) return { error: 'Request not found.' }
    if (wr.status !== 'REQUESTED') return { error: 'Only requested withdrawals can be confirmed.' }
    await prismaUnfiltered.withdrawalRequest.update({
      where: { id },
      data: { status: 'STAFF_CONFIRMED', staffConfirmedById: staff.id, staffConfirmedAt: new Date() },
    })
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'WithdrawalRequest',
      entityId: id,
      userId: staff.id,
      description: 'Staff confirmed withdrawal.',
    })
    revalidatePath('/staff/withdrawals')
    return { success: true }
  } catch (e) {
    console.error('[staffConfirmWithdrawal]', e)
    return { error: 'Failed to confirm withdrawal.' }
  }
}

/** Staff or admin rejects a withdrawal. */
export async function rejectWithdrawal(id: string, reason: string) {
  try {
    const staff = await requireStaff()
    const wr = await prismaUnfiltered.withdrawalRequest.findUnique({ where: { id } })
    if (!wr) return { error: 'Request not found.' }
    if (!OPEN_STATUSES.includes(wr.status as (typeof OPEN_STATUSES)[number])) {
      return { error: 'This request can no longer be rejected.' }
    }
    await prismaUnfiltered.withdrawalRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectedById: staff.id, rejectedReason: reason?.trim() || null },
    })
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'WithdrawalRequest',
      entityId: id,
      userId: staff.id,
      description: 'Withdrawal rejected.',
    })
    revalidatePath('/staff/withdrawals')
    return { success: true }
  } catch (e) {
    console.error('[rejectWithdrawal]', e)
    return { error: 'Failed to reject withdrawal.' }
  }
}

/**
 * Admin final approval. May approve a STAFF_CONFIRMED request, or a REQUESTED
 * one directly. Applies status/flag effects only (no money movement).
 */
export async function adminApproveWithdrawal(id: string, financialSettlementNotes?: string) {
  try {
    const admin = await requireAdmin()
    const wr = await prismaUnfiltered.withdrawalRequest.findUnique({ where: { id } })
    if (!wr) return { error: 'Request not found.' }
    if (wr.status !== 'REQUESTED' && wr.status !== 'STAFF_CONFIRMED') {
      return { error: 'Only requested or staff-confirmed withdrawals can be approved.' }
    }

    const now = new Date()
    await prismaUnfiltered.$transaction(async (tx) => {
      await tx.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          adminApprovedById: admin.id,
          adminApprovedAt: now,
          effectiveDate: now,
          financialSettlementNotes: financialSettlementNotes?.trim() || null,
        },
      })
      // Status/flag only — finance handled separately via the refund workflow.
      await tx.user.update({ where: { id: wr.userId }, data: { status: 'ARCHIVED' } })
      await tx.enrollment.updateMany({
        where: { userId: wr.userId, status: { notIn: ['WITHDRAWN', 'GRADUATED', 'EXPELLED'] } },
        data: { status: 'WITHDRAWN' },
      })
      await tx.fullTimeEnrollment.updateMany({
        where: { studentId: wr.userId, status: { notIn: ['WITHDRAWN', 'COMPLETED'] } },
        data: { status: 'WITHDRAWN' },
      })
      await tx.modularEnrollment.updateMany({
        where: { studentId: wr.userId, status: { notIn: ['WITHDRAWN', 'GRADUATED'] } },
        data: { status: 'WITHDRAWN' },
      })
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'WithdrawalRequest',
      entityId: id,
      userId: admin.id,
      description: `Admin approved & completed withdrawal for ${wr.userId}.`,
      changes: { effect: 'user ARCHIVED, enrollments WITHDRAWN' },
    })

    revalidatePath('/staff/withdrawals')
    revalidatePath(`/staff/students/${wr.userId}`)
    return { success: true }
  } catch (e) {
    console.error('[adminApproveWithdrawal]', e)
    return { error: 'Failed to approve withdrawal.' }
  }
}
