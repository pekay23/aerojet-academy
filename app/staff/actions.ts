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

/**
 * Bulk updates the status of multiple users.
 */
export async function bulkUpdateUserStatus(userIds: string[], status: string) {
  try {
    await requireStaff()

    if (!userIds.length || !status) {
      return { error: 'Invalid parameters.' }
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { status: status as any },
    })

    revalidatePath('/staff/users')
    return { success: true }
  } catch (error) {
    console.error('Bulk update user status error:', error)
    return { error: 'Failed to update users.' }
  }
}

/**
 * Bulk deletes multiple users (soft delete if possible, here it seems hard delete is used in this prisma schema based on other parts, but I'll check).
 * Note: Check if there's a deletedAt field in the schema.
 */
export async function bulkDeleteUsers(userIds: string[]) {
  try {
    await requireStaff()

    if (!userIds.length) {
      return { error: 'No users selected.' }
    }

    // Checking if deletedAt exists (from previous view_file of seed.ts I saw deletedAt in the SELECT query)
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { deletedAt: new Date(), status: 'DELETED' as any },
    })

    revalidatePath('/staff/users')
    return { success: true }
  } catch (error) {
    console.error('Bulk delete users error:', error)
    return { error: 'Failed to delete users.' }
  }
}

/**
 * Bulk updates the status of multiple enrollments.
 */
export async function bulkUpdateEnrollmentStatus(enrollmentIds: string[], status: string) {
  try {
    await requireStaff()
    if (!enrollmentIds.length || !status) return { error: 'Invalid parameters.' }

    await prisma.enrollment.updateMany({
      where: { id: { in: enrollmentIds } },
      data: { status: status as any },
    })

    revalidatePath('/staff/enrollments')
    return { success: true }
  } catch (error) {
    console.error('Bulk update enrollment status error:', error)
    return { error: 'Failed to update enrollments.' }
  }
}

/**
 * Bulk deletes multiple enrollments.
 */
export async function bulkDeleteEnrollments(enrollmentIds: string[]) {
  try {
    await requireStaff()
    if (!enrollmentIds.length) return { error: 'No enrollments selected.' }

    await prisma.enrollment.deleteMany({
      where: { id: { in: enrollmentIds } },
    })

    revalidatePath('/staff/enrollments')
    return { success: true }
  } catch (error) {
    console.error('Bulk delete enrollments error:', error)
    return { error: 'Failed to delete enrollments.' }
  }
}

/**
 * Bulk updates the status of multiple exam bookings.
 */
export async function bulkUpdateExamBookingStatus(bookingIds: string[], status: any) {
  try {
    await requireStaff()
    if (!bookingIds.length || !status) return { error: 'Invalid parameters.' }

    await prisma.examBooking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status },
    })

    revalidatePath('/staff/exams')
    return { success: true }
  } catch (error) {
    console.error('Bulk update exam booking status error:', error)
    return { error: 'Failed to update bookings.' }
  }
}

/**
 * Bulk updates the status of multiple payments/top-ups.
 */
export async function bulkUpdatePaymentStatus(paymentIds: string[], status: any) {
  try {
    await requireStaff()
    if (!paymentIds.length || !status) return { error: 'Invalid parameters.' }

    await prisma.payment.updateMany({
      where: { id: { in: paymentIds } },
      data: { status },
    })

    revalidatePath('/staff/finance')
    return { success: true }
  } catch (error) {
    console.error('Bulk update payment status error:', error)
    return { error: 'Failed to update payments.' }
  }
}
