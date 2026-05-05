import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireAdmin, hashPassword } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { createAuditLog } from '@/lib/audit/logger'
import { wrapEmail, sendEmail } from '@/lib/email/service'
import crypto from 'crypto'

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%&*'
  const all = upper + lower + digits + special
  const pick = (chars: string) => chars[crypto.randomInt(chars.length)]
  const parts = [pick(upper), pick(lower), pick(digits), pick(special)]
  for (let i = 4; i < 12; i++) parts.push(pick(all))
  for (let i = parts.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[parts[i], parts[j]] = [parts[j], parts[i]]
  }
  return parts.join('')
}

/**
 * POST /api/admin/bulk-send-credentials
 *
 * Generates new temporary passwords and emails credentials to selected users.
 * Supports custom email overrides per user.
 *
 * Body:
 * {
 *   users: [
 *     { userId: "...", customEmail?: "optional@override.com" },
 *     ...
 *   ]
 * }
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin()

  const body = await req.json()
  const { users } = body as {
    users: { userId: string; customEmail?: string }[]
  }

  if (!users || !Array.isArray(users) || users.length === 0) {
    return apiError('users array is required')
  }

  const results: {
    sent: { userId: string; email: string; name: string }[]
    failed: { userId: string; error: string }[]
    credentials: { name: string; email: string; academyEmail: string; temporaryPassword: string }[]
  } = { sent: [], failed: [], credentials: [] }

  // Batch-fetch all users upfront instead of N+1 queries in the loop
  const allUsers = await prismaUnfiltered.user.findMany({
    where: { id: { in: users.map(u => u.userId) } },
    include: { profile: true, wallet: true, studentProfile: true },
  })
  const userMap = new Map(allUsers.map(u => [u.id, u]))

  for (const entry of users) {
    try {
      const user = userMap.get(entry.userId)

      if (!user) {
        results.failed.push({ userId: entry.userId, error: 'User not found' })
        continue
      }

      // Generate new temp password
      const tempPassword = generateSecurePassword()
      const hashedPw = await hashPassword(tempPassword)

      // Update password and set mustChangePassword
      await prismaUnfiltered.user.update({
        where: { id: user.id },
        data: {
          password: hashedPw,
          mustChangePassword: true,
          passwordChanged: false,
        },
      })

      const firstName = user.profile?.firstName || 'Student'
      const lastName = user.profile?.lastName || ''
      const loginEmail = user.academyEmail || user.email
      const sendToEmail = entry.customEmail || user.personalEmail || user.email
      const walletBalance = user.wallet
        ? `${user.wallet.currency} ${Number(user.wallet.availableBalance).toFixed(2)}`
        : 'No wallet'
      const studentId = user.studentProfile?.studentId || 'N/A'

      // Build and send email
      const emailBody = await wrapEmail(
        'Your Aerojet Academy Login Credentials',
        `
        <div class="h1">Welcome to Aerojet Academy</div>
        <div class="text">
          Hello ${firstName},<br/><br/>
          Your student portal account has been created. Please use the credentials below to log in.
          <strong>You will be required to change your password on first login.</strong>
        </div>
        <div class="info-box">
          <div class="info-row"><strong>Login Email:</strong> ${loginEmail}</div>
          <div class="info-row"><strong>Temporary Password:</strong> <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #002a5c;">${tempPassword}</code></div>
          <div class="info-row"><strong>Student ID:</strong> ${studentId}</div>
          <div class="info-row"><strong>Wallet Balance:</strong> ${walletBalance}</div>
        </div>
        <div class="btn-container">
          <a href="${process.env.NEXTAUTH_URL}/login" class="btn">Log In Now</a>
        </div>
        <div class="text" style="font-size: 12px; color: #64748b; margin-top: 16px;">
          If you did not expect this email, please contact the Aerojet Academy administration.
        </div>
        `,
        sendToEmail
      )

      await sendEmail({
        to: sendToEmail,
        subject: 'Your Aerojet Academy Login Credentials',
        html: emailBody,
      })

      results.sent.push({
        userId: user.id,
        email: sendToEmail,
        name: `${firstName} ${lastName}`.trim(),
      })

      results.credentials.push({
        name: `${firstName} ${lastName}`.trim(),
        email: sendToEmail,
        academyEmail: loginEmail,
        temporaryPassword: tempPassword,
      })

      await createAuditLog({
        action: 'SYSTEM_UPDATE',
        entity: 'User',
        entityId: user.id,
        userId: admin.id,
        description: `Bulk sent credentials to ${sendToEmail} for ${firstName} ${lastName}`,
      })
    } catch (error: any) {
      results.failed.push({ userId: entry.userId, error: error.message })
    }
  }

  return apiSuccess({
    summary: {
      total: users.length,
      sent: results.sent.length,
      failed: results.failed.length,
    },
    sent: results.sent,
    failed: results.failed,
    credentials: results.credentials,
  })
})
