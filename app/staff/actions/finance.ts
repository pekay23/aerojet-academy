'use server'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { PaymentStatus } from '@prisma/client'
import { handleActionError } from '@/lib/staff/errors'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'

export async function bulkUpdatePaymentStatus(paymentIds: string[], status: PaymentStatus) {
  try {
    const user = await requireStaff()
    if (!paymentIds.length || !status) return { error: 'Invalid parameters.' }

    await prismaUnfiltered.payment.updateMany({
      where: { id: { in: paymentIds } },
      data: { status },
    })

    revalidatePath('/staff/finance')
    revalidatePath('/student')

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'Payment',
      entityId: paymentIds[0],
      userId: user.id,
      description: `Bulk updated payment status to ${status} for ${paymentIds.length} payments`,
      changes: { paymentIds, status },
      ...ctx,
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkUpdatePaymentStatus', error, 'Failed to update payments.') }
  }
}

export async function updateRevenueTarget(amount: number) {
  try {
    const user = await requireStaff()
    const { updateSystemSetting } = await import('@/lib/settings')
    await updateSystemSetting('target_monthly_revenue', amount.toString())
    revalidatePath('/staff/dashboard')

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.SYSTEM_UPDATE,
      entity: 'SystemSetting',
      entityId: 'target_monthly_revenue',
      userId: user.id,
      description: `Revenue target updated to ${amount}`,
      changes: { target_monthly_revenue: amount },
      ...ctx,
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('updateRevenueTarget', error, 'Failed to update target.') }
  }
}
