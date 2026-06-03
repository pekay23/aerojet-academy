import 'server-only'
import { getBaseUrl } from '@/lib/utils/url'

const baseLayout = async (content: string, title?: string) => {
  const appUrl = await getBaseUrl()
  const currentYear = new Date().getFullYear()

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${title ? `<title>${title}</title>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0;padding:0;background-color:#f4f6f8;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 24px;background-color:#ffffff;">
              <img src="${appUrl}/images/logos/AATA_logo_hor_onWhite.png" alt="Aerojet Aviation Training Academy" width="220" style="display:block;outline:none;border:none;text-decoration:none;max-width:100%;height:auto;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;color:#334155;font-size:16px;line-height:24px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#002a5c;padding:32px 24px;border-top:1px solid #002a5c;">
              <div style="text-align:center;margin-bottom:16px;">
                <img src="${appUrl}/images/logos/ATA_logo_hor_onDark.png" alt="Aerojet Aviation Training Academy" width="160" style="display:inline-block;outline:none;border:none;text-decoration:none;max-width:100%;height:auto;" />
              </div>
              <p style="margin:0 0 4px 0;font-size:14px;color:#ffffff;text-align:center;font-weight:600;">
                Aerojet Aviation Training Academy
              </p>
              <p style="margin:0 0 4px 0;font-size:13px;color:#93c5fd;text-align:center;">
                Accra Technical Training Centre
              </p>
              <p style="margin:0 0 4px 0;font-size:13px;color:#93c5fd;text-align:center;">
                Kokomlemle, Accra - Ghana
              </p>
              <p style="margin:0 0 16px 0;font-size:13px;color:#93c5fd;text-align:center;">
                +233-20-984-8423
              </p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;text-align:center;">
                &copy; ${currentYear} Aerojet Aviation Training Academy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Bottom Links -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;">
          <tr>
            <td align="center" style="padding:24px 0 0 0;font-size:12px;color:#94a3b8;">
              <a href="${appUrl}" style="color:#94a3b8;text-decoration:underline;">Website</a> &bull;
              <a href="${appUrl}/contact" style="color:#94a3b8;text-decoration:underline;">Contact Support</a> &bull;
              <a href="${appUrl}/privacy-policy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function welcomeEmail(name: string, registrationCode: string) {
  return await baseLayout(
    `
    <h2 style="color:#0f172a;">Welcome to Aerojet Aviation Training Academy, ${name}!</h2>
    <p>Thank you for registering. Your registration code is:</p>
    <div style="background:#f1f5f9;padding:16px;border-radius:8px;text-align:center;margin:16px 0;">
      <strong style="font-size:20px;color:#0f172a;">${registrationCode}</strong>
    </div>
    <p>Please keep this code safe. You will need it to track your application status.</p>
    <p><strong>Next steps:</strong></p>
    <p>1. Upload your payment proof via the applicant portal<br>2. Wait for staff verification<br>3. Receive your academy email and credentials</p>
  `
  )
}

export async function activationEmail(name: string, academyEmail: string, tempPassword: string) {
  return await baseLayout(
    `
    <h2 style="color:#0f172a;">Account Activated!</h2>
    <p>Dear ${name},</p>
    <p>Your Aerojet Aviation Training Academy account has been activated. Here are your credentials:</p>
    <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;">
      <p><strong>Academy Email:</strong> ${academyEmail}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
    </div>
    <p style="color:#dc2626;"><strong>Important:</strong> You must change your password on first login.</p>
    <p>You can now log in at the student portal to browse courses and manage your account.</p>
  `
  )
}

export async function passwordResetEmail(name: string, resetLink: string) {
  return await baseLayout(
    `
    <h2 style="color:#0f172a;">Password Reset</h2>
    <p>Dear ${name},</p>
    <p>We received a request to reset your password. Click the button below:</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${resetLink}" style="background-color: #0f172a; color: #ffffff !important; padding: 12px 32px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
        <span style="color: #ffffff !important;">Reset Password</span>
      </a>
    </div>
    <p style="font-size:12px;color:#64748b;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  `
  )
}

export async function paymentApprovedEmail(name: string, amount: string, reference: string) {
  return await baseLayout(
    `
    <h2 style="color:#0f172a;">Payment Approved</h2>
    <p>Dear ${name},</p>
    <p>Your payment has been verified and approved.</p>
    <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #22c55e;">
      <p><strong>Amount:</strong> ${amount}</p>
      <p><strong>Reference:</strong> ${reference}</p>
    </div>
  `
  )
}

export async function promotionToStudentEmail(
  name: string,
  studentId: string,
  academyEmail: string
) {
  return await baseLayout(
    `
    <h2 style="color:#0f172a;">Congratulations, ${name}!</h2>
    <p>You have been promoted to a full student at Aerojet Aviation Training Academy.</p>
    <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;">
      <p><strong>Student ID:</strong> ${studentId}</p>
      <p><strong>Academy Email:</strong> ${academyEmail}</p>
    </div>
    <p>Your student wallet has been created. You can now enroll in courses and join exam bookings.</p>
  `
  )
}

export async function poolConfirmedEmail(
  name: string,
  poolName: string,
  examDate: string,
  module: string,
  capturedAmount?: string
) {
  const amountText = capturedAmount || 'your reserved funds'
  return await baseLayout(
    `
    <h2 style="color:#0f172a;">Exam Booking Confirmed!</h2>
    <p>Dear ${name},</p>
    <p>Great news! Your exam booking has reached the minimum 25 candidates and is now confirmed.</p>
    <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #22c55e;">
      <p><strong>Pool:</strong> ${poolName}</p>
      <p><strong>Exam Date:</strong> ${examDate}</p>
      <p><strong>Module:</strong> ${module}</p>
    </div>
    <p>Your reserved funds (${amountText}) have been captured. Good luck with your exam!</p>
  `,
    'Exam Booking Confirmed'
  )
}

export async function poolFailedEmail(
  name: string,
  poolName: string,
  examDate: string,
  releasedAmount?: string
) {
  const amountText = releasedAmount || 'your reserved funds'
  return await baseLayout(
    `
    <h2 style="color:#dc2626;">Exam Booking Did Not Reach Minimum</h2>
    <p>Dear ${name},</p>
    <p>Unfortunately, the exam booking below did not reach the required 25 candidates by the deadline.</p>
    <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #dc2626;">
      <p><strong>Pool:</strong> ${poolName}</p>
      <p><strong>Exam Date:</strong> ${examDate}</p>
    </div>
    <p>Your reserved funds (${amountText}) have been released back to your wallet. You may join another booking.</p>
  `,
    'Exam Booking Postponed'
  )
}

export async function examReminderEmail(
  name: string,
  poolName: string,
  examDate: string,
  daysUntil: number
) {
  return await baseLayout(
    `
    <h2 style="color:#0f172a;">Exam Reminder</h2>
    <p>Dear ${name},</p>
    <p>This is a reminder that your exam is coming up in <strong>${daysUntil} day${daysUntil > 1 ? 's' : ''}</strong>.</p>
    <div style="background:#eff6ff;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #3b82f6;">
      <p><strong>Pool:</strong> ${poolName}</p>
      <p><strong>Exam Date:</strong> ${examDate}</p>
    </div>
    <p>Make sure to prepare all required documents and arrive on time. Good luck!</p>
  `,
    'Exam Reminder'
  )
}

export async function contactFormEmail(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  return await baseLayout(
    `
    <h2 style="color:#0f172a;">New Contact Form Submission</h2>
    <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;">
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
    </div>
    <div style="margin-top:16px;padding:16px;border:1px solid #e2e8f0;border-radius:8px;">
      <p>${message.replace(/\n/g, '<br>')}</p>
    </div>
  `,
    'New Contact Form Submission'
  )
}
