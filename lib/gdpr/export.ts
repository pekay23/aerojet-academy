/**
 * GDPR Article 15 — data subject access export.
 *
 * Returns a deeply-traversed JSON snapshot of every personal-data record
 * associated with a User id. Intended to be returned as a download from
 * `/api/staff/users/[id]/gdpr-export` and attached to the DSR record.
 */

import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'

export async function buildUserDataExport(userId: string) {
  const user = await prismaUnfiltered.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      studentProfile: true,
      staffProfile: true,
      instructorProfile: true,
      examinerProfile: true,
      wallet: { include: { transactions: { orderBy: { createdAt: 'asc' } } } },
      enrollments: true,
      fullTimeEnrollments: true,
      modularEnrollments: true,
      examBookings: true,
      examResults: true,
      grades: true,
      attendanceRecords: true,
      messagesSent: { select: { id: true, subject: true, body: true, createdAt: true, recipientId: true } },
      messagesReceived: { select: { id: true, subject: true, body: true, createdAt: true, senderId: true } },
      notificationsReceived: { select: { id: true, type: true, title: true, message: true, createdAt: true } },
      payments: true,
      invoices: true,
      refunds: true,
      withdrawalRequests: true,
      auditLogs: { take: 500, orderBy: { createdAt: 'desc' } },
      fileUploads: { select: { id: true, route: true, originalName: true, mimeType: true, size: true, createdAt: true, url: true, supabasePath: true } },
      referralsMade: true,
      referralsReceived: true,
      studentDocuments: true,
      progressionLogs: true,
      passkeys: { select: { id: true, name: true, createdAt: true, lastUsedAt: true } },
    },
  })
  if (!user) throw new Error('User not found')
  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user,
  }
}
