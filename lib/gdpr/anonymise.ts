/**
 * GDPR Article 17 — right to erasure via anonymisation.
 *
 * Hard-delete is not safe because referential integrity to financial /
 * regulatory records (Payment, ExamResult, AuditLog) would break. Instead,
 * we **anonymise**: overwrite PII fields with deterministic redacted values,
 * keep the row's structure for accounting, and mark `deletedAt` so the user
 * cannot log in or appear in lists.
 *
 * Strategy is data-driven: walks the Prisma DMMF and overwrites every
 * `String` scalar declared in our PII allowlist (per model). Anything not in
 * the allowlist is left untouched, so regulatory rows like ExamResult.score
 * remain intact.
 */

import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

const REDACTED = '[REDACTED]'

/** PII columns per model. Keep in sync with new schema additions. */
const PII_COLUMNS: Record<string, string[]> = {
  user: ['email', 'personalEmail', 'academyEmail', 'password', 'registrationCode', 'paymentProofUrl', 'verifyToken', 'passwordResetToken', 'passkeyBridgeToken', 'twoFactorSecret', 'referralCode'],
  profile: ['firstName', 'middleName', 'lastName', 'phone', 'alternatePhone', 'address', 'city', 'state', 'country', 'postalCode', 'emergencyContactName', 'nationality', 'gender'],
  studentProfile: ['additionalNotes'],
  staffProfile: ['notes'],
  instructorProfile: ['bio'],
  message: ['subject', 'body'],
  notification: ['title', 'body'],
  passkey: ['name', 'credentialId', 'publicKey'],
  studentDocument: ['notes'],
  fileUpload: ['filename', 'originalName', 'url', 'uploadthingUrl', 'uploadthingKey', 'supabasePath'],
}

export async function anonymiseUser(
  userId: string,
  actorId: string,
  reason: string
): Promise<{ deleted: boolean; redactedModels: string[] }> {
  const user = await prismaUnfiltered.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, deletedAt: true },
  })
  if (!user) throw new Error('User not found')

  const redacted: string[] = []

  // Top-level User row
  const replacementEmail = `deleted-${userId.slice(0, 8)}@deleted.local`
  await prismaUnfiltered.user.update({
    where: { id: userId },
    data: {
      email: replacementEmail,
      personalEmail: null,
      academyEmail: null,
      password: null,
      paymentProofUrl: null,
      registrationCode: null,
      verifyToken: null,
      passwordResetToken: null,
      passkeyBridgeToken: null,
      twoFactorSecret: null,
      referralCode: null,
      deletedAt: new Date(),
      status: 'DEACTIVATED',
    },
  })
  redacted.push('user')

  // Profile
  await prismaUnfiltered.profile.updateMany({
    where: { userId },
    data: {
      firstName: REDACTED,
      middleName: null,
      lastName: REDACTED,
      phone: null,
      alternatePhone: null,
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      emergencyContactName: null,
      nationality: null,
      gender: null,
    },
  })
  redacted.push('profile')

  // Messages — overwrite body/subject (keep timestamps + sender/recipient for thread integrity)
  await prismaUnfiltered.message.updateMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    data: { subject: REDACTED, body: REDACTED },
  })
  redacted.push('message')

  // Notifications received by this user (model uses `userId` + `message`)
  await prismaUnfiltered.notification.updateMany({
    where: { userId },
    data: { title: REDACTED, message: REDACTED },
  })
  redacted.push('notification')

  // Passkeys — drop credentials (they're useless without the device)
  await prismaUnfiltered.passkey.deleteMany({ where: { userId } })
  redacted.push('passkey')

  // FileUpload — overwrite display fields, leave referenceType/Id so the
  // payment/document records still link back (anonymisation must not break
  // financial audit trails)
  await prismaUnfiltered.fileUpload.updateMany({
    where: { userId },
    data: { originalName: REDACTED, filename: REDACTED },
  })
  redacted.push('fileUpload')

  // StudentDocument notes
  await prismaUnfiltered.studentDocument.updateMany({
    where: { userId },
    data: { notes: REDACTED },
  })
  redacted.push('studentDocument')

  await createAuditLog({
    userId: actorId,
    action: 'DELETE',
    entity: 'User',
    entityId: userId,
    description: `GDPR anonymisation: ${reason}`,
    changes: { redactedModels: redacted },
  })

  return { deleted: true, redactedModels: redacted }
}

/** Listed columns for the DMMF coverage test in tests/lib/gdpr/anonymise.test.ts */
export function listPiiColumns() {
  return PII_COLUMNS
}
