'use server'

import { getAuthSession, requireStaff } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'

/**
 * Fetches all users that staff can message: Students, Instructors, other Staff/Admins.
 * Groups them by role for easier selection.
 */
export async function getStaffRecipients() {
  const user = await requireStaff().catch(() => null)
  if (!user) return []

  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      id: { not: user.id }, // Exclude self
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

/**
 * Sends a message from the logged-in staff member to a recipient.
 */
export async function sendStaffMessage(recipientId: string, subject: string, body: string) {
  try {
    const user = await requireStaff()

    if (!recipientId || !subject || !body) {
      return { error: 'All fields are required.' }
    }

    await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId,
        subject,
        body,
        isRead: false,
      },
    })

    revalidatePath('/staff/messages')
    return { success: true }
  } catch (error) {
    console.error('Send staff message error:', error)
    return { error: 'Failed to send message.' }
  }
}

/**
 * Marks a message as read.
 */
export async function markMessageAsRead(messageId: string) {
  try {
    const user = await requireStaff()

    await prisma.message.update({
      where: { id: messageId, recipientId: user.id },
      data: { isRead: true, readAt: new Date() },
    })

    revalidatePath('/staff/messages')
    return { success: true }
  } catch (error) {
    console.error('Mark message as read error:', error)
    return { error: 'Failed to mark message as read.' }
  }
}
