import { NotificationType } from '@prisma/client'
import { getFinanceConfig, getRegistrationConfig } from '@/lib/settings'
import { getBaseUrl } from '@/lib/utils/url'

type TxClient = any // Prisma transaction client

// ---------------------------------------------------------------------------
// NOTIFICATION CREATOR (for use within transactions)
// ---------------------------------------------------------------------------

export async function createNotification(
  tx: TxClient,
  userId: string,
  data: {
    type: NotificationType
    title: string
    message: string
    link?: string
  }
) {
  return tx.notification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    },
  })
}

// ---------------------------------------------------------------------------
// EMAIL SENDING (via Resend)
// ---------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@aerojet-academy.com'
const BASE_URL = getBaseUrl()

interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set. Logging email instead:', payload.subject)
    console.log(`To: ${payload.to} | Subject: ${payload.subject}`)
    return true
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    })

    if (!res.ok) {
      console.error('[Email] Send failed:', await res.text())
      return false
    }

    return true
  } catch (error) {
    console.error('[Email] Error:', error)
    return false
  }
}

// ---------------------------------------------------------------------------
// EMAIL TEMPLATES
// ---------------------------------------------------------------------------

const DOMAIN = getBaseUrl()

const LOGO_DARK_ON_WHITE = `https://lightpink-guanaco-745322.hostingersite.com/wp-content/uploads/2024/03/ATA_logo_hor_onWhite-1-e1711591369108.png`
const LOGO_WHITE_ON_DARK = `https://lightpink-guanaco-745322.hostingersite.com/wp-content/uploads/2024/03/ATA_logo_hor_onDark-1-e1711591332243.png`

const COLORS = {
  navy: '#002a5c',
  sky: '#4c9ded',
  white: '#ffffff',
  gray: '#f4f6f8',
  text: '#334155',
}

export const wrapEmail = (title: string, bodyContent: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${COLORS.gray}; color: ${COLORS.text}; }
          table { border-collapse: collapse; width: 100%; border-spacing: 0; }
          img { border: 0; outline: none; text-decoration: none; }
          .wrapper { width: 100%; background-color: ${COLORS.gray}; padding: 20px 0 0 0; } 
          .main-table { max-width: 600px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px 8px 0 0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background-color: ${COLORS.white}; padding: 20px 30px; border-bottom: 1px solid #f1f5f9; text-align: left; }
          .header img { height: 36px; width: auto; display: block; }
          .content { padding: 40px 30px; }
          .h1 { color: ${COLORS.navy}; font-size: 22px; font-weight: 800; margin: 0 0 20px 0; letter-spacing: -0.5px; }
          .text { font-size: 15px; line-height: 1.6; color: ${COLORS.text}; margin-bottom: 15px; }
          .btn-container { margin: 30px 0; }
          .btn { background-color: ${COLORS.navy}; color: ${COLORS.white}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; }
          .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${COLORS.navy}; padding: 15px; margin: 25px 0; border-radius: 4px; }
          .info-row { margin-bottom: 5px; font-size: 14px; }
          .footer { background-color: ${COLORS.navy}; padding: 40px 30px; color: #94a3b8; font-size: 12px; }
          .footer-logo { width: 160px; height: auto; display: block; }
          .footer-contact { text-align: right; color: #cbd5e1; line-height: 1.5; }
          .footer-links { text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 20px; }
          .footer-links a { color: ${COLORS.sky}; text-decoration: none; margin: 0 10px; font-weight: bold; }
          .copyright { text-align: center; margin-top: 15px; opacity: 0.5; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <table class="main-table" align="center">
            <tr><td class="header"><img src="${LOGO_DARK_ON_WHITE}" alt="Aerojet Academy" /></td></tr>
            <tr><td class="content"><h1 class="h1">${title}</h1>${bodyContent}</td></tr>
            <tr>
              <td class="footer" bgcolor="${COLORS.navy}" style="background-color: ${COLORS.navy} !important;">
                <table width="100%">
                  <tr>
                    <td valign="top"><img src="${LOGO_WHITE_ON_DARK}" class="footer-logo" alt="Aerojet Academy" /></td>
                    <td valign="top" class="footer-contact" style="color: #cbd5e1 !important; text-align: right;">
                      <strong style="white-space: nowrap;">Aerojet Aviation Training Academy</strong><br/>
                      <span style="font-size: 11px; opacity: 0.8;">Small Engines Dept., ATTC<br/>Kokomlemle, Accra - Ghana<br/>+233 209 848 423</span>
                    </td>
                  </tr>
                </table>
                <div class="footer-links" style="border-top: 1px solid rgba(255,255,255,0.1) !important;">
                  <a href="${DOMAIN}" style="color: ${COLORS.sky} !important;">Website</a>
                  <a href="${DOMAIN}/login" style="color: ${COLORS.sky} !important;">Portal</a>
                </div>
                <div class="copyright" style="color: #94a3b8 !important; opacity: 1 !important;">&copy; ${new Date().getFullYear()} Aerojet Aviation. All rights reserved.</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `
}

// ---------------------------------------------------------------------------
// REGISTRATION
// ---------------------------------------------------------------------------

export async function sendRegistrationEmail(
  email: string,
  firstName: string,
  registrationCode: string
) {
  const finance = await getFinanceConfig()
  const config = await getRegistrationConfig()

  return sendEmail({
    to: email,
    subject: 'Welcome to Aerojet Aviation - Registration Received',
    html: wrapEmail(
      `Welcome, ${firstName}!`,
      `
      <div style="margin-bottom: 24px;">
        <div style="color: #16a34a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          ✓ Registration Received
        </div>
        <p class="text" style="font-size: 16px; color: #475569;">
          Thank you for registering. We have received your details. To proceed with your enrollment, please complete the registration fee payment using the details below.
        </p>
      </div>
      
      <!-- Reference Code Card -->
      <div style="background-color: #137fec; border-radius: 12px; padding: 24px; color: #ffffff; margin-bottom: 32px; box-shadow: 0 4px 6px -1px rgba(19, 127, 236, 0.2);">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 8px;">
          Your Reference Code
        </div>
        <div style="font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 2px; margin-bottom: 20px;">
          ${registrationCode}
        </div>
        
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 16px;">
          <div style="font-size: 12px; font-weight: 500; opacity: 0.8;">Fee Amount</div>
          <div style="font-size: 20px; font-weight: 700;">${config.currency} ${config.fee}</div>
        </div>
      </div>

      <!-- Payment Details Section -->
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">Bank Transfer Details</h3>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
                <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Bank Name</div>
                <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${finance.bankName || 'FNB Ghana'}</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
                <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Account Name</div>
                <div style="font-size: 15px; font-weight: 600; color: #0f172a;">${finance.bankAccountName || 'Aerojet Aviation Foundation'}</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
                <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Account Number</div>
                <div style="font-family: monospace; font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">${finance.bankAccountNumber || 'N/A'}</div>
              </td>
            </tr>
            ${
              finance.bankSwift
                ? `
            <tr>
              <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
                <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">SWIFT / BIC Code</div>
                <div style="font-family: monospace; font-size: 16px; font-weight: 700; color: #0f172a;">${finance.bankSwift}</div>
              </td>
            </tr>
            `
                : ''
            }
            <tr>
              <td style="padding: 16px; background-color: #f1f5f9;">
                <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Payment Reference</div>
                <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #137fec;">${registrationCode}</div>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
          <strong>Important:</strong> Please ensure the payment reference <strong style="color: #b45309;">${registrationCode}</strong> is included in your bank transfer to avoid delays in processing your application.
        </p>
      </div>

      <div class="btn-container" style="text-align: center; margin-top: 30px;">
        <a href="${BASE_URL}/upload-proof?code=${registrationCode}" class="btn">Upload Payment Proof</a>
      </div>
    `
    ),
  })
}

// ---------------------------------------------------------------------------
// ACCOUNT ACTIVATION
// ---------------------------------------------------------------------------

export async function sendActivationEmail(
  email: string,
  firstName: string,
  academyEmail: string,
  tempPassword: string,
  verifyToken: string
) {
  const verifyUrl = `${BASE_URL}/verify-email?token=${verifyToken}`

  return sendEmail({
    to: email,
    subject: 'Aerojet Aviation - Account Activated',
    html: wrapEmail(
      `Account Activated, ${firstName}!`,
      `
      <p class="text">Your registration payment has been approved. You can now access the Applicant Portal.</p>
      
      <div class="info-box" style="border-left-color: #22c55e;">
        <div class="info-row"><strong>Login Credentials:</strong></div>
        <div class="info-row" style="margin-top:10px;">
          <strong>Academy Email:</strong><br/>
          <span style="font-size: 15px; color: #002a5c; font-weight:bold;">${academyEmail}</span>
        </div>
        <div class="info-row" style="margin-top:5px;">
          <strong>Temporary Password:</strong><br/>
          <span style="font-family: monospace; font-size: 16px; letter-spacing: 1px; color: #000; background: #fff3cd; padding: 4px 8px; border-radius: 4px;">${tempPassword}</span>
        </div>
      </div>

      <p class="text" style="font-size: 13px; color: #d97706; background: #fef3c7; padding: 10px; border-radius: 4px; border-left: 3px solid #d97706;">
        <strong>⚠️ Important:</strong> You must verify your email and change your password on your first login.
      </p>

      <div class="btn-container">
        <a href="${verifyUrl}" class="btn">Verify & Access Portal</a>
      </div>
    `
    ),
  })
}

// ---------------------------------------------------------------------------
// STUDENT PROMOTION
// ---------------------------------------------------------------------------

export async function sendStudentPromotionEmail(
  email: string,
  firstName: string,
  studentId: string
) {
  return sendEmail({
    to: email,
    subject: 'Aerojet Aviation - Welcome, Student!',
    html: wrapEmail(
      `Congratulations, ${firstName}!`,
      `
      <p class="text">Your course enrollment has been approved. You are now a Student at Aerojet Aviation Training Academy.</p>
      
      <div class="info-box" style="border-left-color: #22c55e;">
        <div class="info-row"><strong>Your Student ID:</strong></div>
        <div class="info-row" style="margin-top:5px;">
          <span style="font-family: monospace; font-size: 20px; letter-spacing: 2px; color: #2e7d32; font-weight:bold; background: #e8f5e9; padding: 4px 12px; border-radius: 4px;">${studentId}</span>
        </div>
      </div>

      <p class="text" style="margin-top: 16px;">A wallet has been created for your account. You can now:</p>
      <ul style="color: #334155; line-height: 1.6; margin-bottom: 20px;">
        <li>Access course materials</li>
        <li>Book exam pool seats</li>
        <li>Track attendance and grades</li>
        <li>Manage your wallet</li>
      </ul>

      <div class="btn-container">
        <a href="${BASE_URL}/login" class="btn">Go to Student Portal</a>
      </div>
    `
    ),
  })
}

// ---------------------------------------------------------------------------
// POOL CONFIRMED
// ---------------------------------------------------------------------------

export async function sendPoolConfirmedEmail(
  email: string,
  firstName: string,
  poolName: string,
  module: string,
  examDate: string,
  amount: number
) {
  return sendEmail({
    to: email,
    subject: `Aerojet Aviation - Exam Pool Confirmed: ${poolName}`,
    html: wrapEmail(
      `Exam Pool Confirmed!`,
      `
      <p class="text">Hi ${firstName}, great news! <strong>${poolName}</strong> has reached the minimum candidates and is confirmed.</p>
      
      <div class="info-box" style="border-left-color: #22c55e;">
        <div class="info-row"><strong>Module:</strong> ${module}</div>
        <div class="info-row"><strong>Exam Date:</strong> ${examDate}</div>
        <div class="info-row font-bold"><strong>Amount Paid:</strong> €${amount}</div>
      </div>

      <p class="text">€${amount} has been deducted from your wallet. Please prepare for your exam.</p>
    `
    ),
  })
}

// ---------------------------------------------------------------------------
// PASSWORD RESET
// ---------------------------------------------------------------------------

export async function sendPasswordResetEmail(email: string, firstName: string, resetToken: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`

  return sendEmail({
    to: email,
    subject: 'Aerojet Aviation - Password Reset',
    html: wrapEmail(
      `Password Reset Request`,
      `
      <p class="text">Hi ${firstName}, we received a request to reset your password.</p>
      
      <div class="btn-container">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>

      <p class="text" style="font-size: 13px; color: #666;">
        This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    `
    ),
  })
}

// ---------------------------------------------------------------------------
// PAYMENT APPROVED/REJECTED
// ---------------------------------------------------------------------------

export async function sendPaymentApprovedEmail(
  email: string,
  firstName: string,
  paymentType: string,
  amount: number
) {
  return sendEmail({
    to: email,
    subject: 'Aerojet Aviation - Payment Approved',
    html: wrapEmail(
      `Payment Approved`,
      `
      <p class="text">Hi ${firstName}, your ${paymentType} payment of <strong>€${amount}</strong> has been approved.</p>
      
      <div class="info-box" style="border-left-color: #22c55e;">
        <div class="info-row"><strong>Status:</strong> <span style="color:#15803d; font-weight:bold;">PAID ✅</span></div>
        <div class="info-row font-bold" style="margin-top:5px;"><strong>Amount:</strong> €${amount}</div>
        <div class="info-row"><strong>Description:</strong> ${paymentType}</div>
      </div>
    `
    ),
  })
}

export async function sendPaymentRejectedEmail(
  email: string,
  firstName: string,
  paymentType: string,
  reason: string
) {
  return sendEmail({
    to: email,
    subject: 'Aerojet Aviation - Payment Rejected',
    html: wrapEmail(
      `Payment Not Approved`,
      `
      <p class="text">Hi ${firstName}, your ${paymentType} payment was not approved.</p>
      
      <div class="info-box" style="border-left-color: #ef4444;">
        <div class="info-row"><strong>Status:</strong> <span style="color:#dc2626; font-weight:bold;">REJECTED ❌</span></div>
        <div class="info-row" style="margin-top:5px;"><strong>Reason:</strong> ${reason}</div>
      </div>

      <p class="text">Please log in to your portal and re-upload a valid payment proof or contact the admissions office.</p>

      <div class="btn-container">
        <a href="${DOMAIN}/login" class="btn">Login to Upload Proof</a>
      </div>
    `
    ),
  })
}

// ---------------------------------------------------------------------------
// CONTACT ENQUIRY
// ---------------------------------------------------------------------------

export async function sendContactEnquiryConfirmation(email: string, name: string, subject: string) {
  return sendEmail({
    to: email,
    subject: `Aerojet Academy - Enquiry Received: ${subject}`,
    html: wrapEmail(
      `We received your enquiry`,
      `
      <p class="text">Hi ${name.split(' ')[0]},</p>
      <p class="text">
        Thank you for reaching out to Aerojet Aviation Training Academy. We have received your enquiry regarding <strong>${subject}</strong> and our admissions team will review it and get back to you as soon as possible.
      </p>
      <div class="info-box">
        <div class="info-row"><strong>Admissions Team</strong></div>
        <div class="info-row" style="margin-top:5px;">📞 +233 209 848 423</div>
        <div class="info-row">✉️ trainingprograms@aerojet-academy.com</div>
      </div>
      <p class="text">In the meantime, feel free to explore our website for more information about our programmes.</p>
    `
    ),
  })
}
