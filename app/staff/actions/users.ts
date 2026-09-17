'use server'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { UserStatus } from '@prisma/client'
import { handleActionError } from '@/lib/staff/errors'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'

export async function bulkUpdateUserStatus(userIds: string[], status: UserStatus) {
  try {
    const user = await requireStaff()

    if (!userIds.length || !status) {
      return { error: 'Invalid parameters.' }
    }

    await prismaUnfiltered.user.updateMany({
      where: { id: { in: userIds } },
      data: { status },
    })

    revalidatePath('/staff/users')

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: userIds[0],
      userId: user.id,
      description: `Bulk updated user status to ${status} for ${userIds.length} users`,
      changes: { userIds, status },
      ...ctx,
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkUpdateUserStatus', error, 'Failed to update users.') }
  }
}

export async function bulkDeleteUsers(userIds: string[]) {
  try {
    const user = await requireStaff()

    if (!userIds.length) {
      return { error: 'No users selected.' }
    }

    await prismaUnfiltered.user.deleteMany({
      where: { id: { in: userIds } },
    })

    revalidatePath('/staff/users')

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'User',
      entityId: userIds[0],
      userId: user.id,
      description: `Permanently deleted ${userIds.length} users`,
      changes: { userIds },
      ...ctx,
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkDeleteUsers', error, 'Failed to delete users permanently.') }
  }
}

export async function bulkArchiveUsers(userIds: string[]) {
  try {
    const user = await requireStaff()
    if (!userIds.length) return { error: 'No users selected.' }

    await prismaUnfiltered.user.updateMany({
      where: { id: { in: userIds } },
      data: { status: UserStatus.ARCHIVED },
    })

    revalidatePath('/staff/users')

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: userIds[0],
      userId: user.id,
      description: `Archived ${userIds.length} users`,
      changes: { userIds, status: UserStatus.ARCHIVED },
      ...ctx,
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkArchiveUsers', error, 'Failed to archive users.') }
  }
}

export async function bulkBypassPasswordChange(userIds: string[]) {
  try {
    const user = await requireStaff()
    if (!userIds.length) return { error: 'No users selected.' }

    await prismaUnfiltered.user.updateMany({
      where: { id: { in: userIds } },
      data: { mustChangePassword: false },
    })

    revalidatePath('/staff/users')

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: userIds[0],
      userId: user.id,
      description: `Bypassed password change for ${userIds.length} users`,
      changes: { userIds, mustChangePassword: false },
      ...ctx,
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkBypassPasswordChange', error, 'Failed to update users.') }
  }
}
