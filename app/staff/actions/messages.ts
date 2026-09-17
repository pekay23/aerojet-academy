'use server'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { UserStatus } from '@prisma/client'
import { handleActionError } from '@/lib/staff/errors'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'

export async function getStaffRecipients() {
  const user = await requireStaff().catch(() => null)
  if (!user) return []

  const users = await prismaUnfiltered.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      id: { not: user.id },
    },
    select: {
      id: true,
      role: true,
      email: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
        },
      },
    },
    orderBy: [{ role: 'asc' }],
  })

  return users.map((u) => ({
    id: u.id,
    role: u.role,
    email: u.email,
    label: u.profile
      ? `${u.profile.firstName} ${u.profile.lastName} (${u.role})`
      : `${u.email} (${u.role})`,
    avatarUrl: u.profile?.profilePhotoUrl,
  }))
}

export async function sendStaffMessage(recipientId: string, subject: string, body: string) {
  try {
    const user = await requireStaff()

    if (!recipientId || !subject || !body) {
      return { error: 'All fields are required.' }
    }

    const message = await prismaUnfiltered.message.create({
      data: {
        senderId: user.id,
        recipientId,
        subject,
        body,
        isRead: false,
      },
    })

    revalidatePath('/staff/messages')

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'Message',
      entityId: message.id,
      userId: user.id,
      description: `Staff message sent to ${recipientId}: "${subject}"`,
      changes: { recipientId, subject },
      ...ctx,
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('sendStaffMessage', error, 'Failed to send message.') }
  }
}

export async function markMessageAsRead(messageId: string) {
  try {
    const user = await requireStaff()

    const message = await prismaUnfiltered.message.update({
      where: { id: messageId, recipientId: user.id },
      data: { isRead: true, readAt: new Date() },
    })

    revalidatePath('/staff/messages')

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'Message',
      entityId: message.id,
      userId: user.id,
      description: `Message ${messageId} marked as read`,
      changes: { isRead: true },
      ...ctx,
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('markMessageAsRead', error, 'Failed to mark message as read.') }
  }
}
