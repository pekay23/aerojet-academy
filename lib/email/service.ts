import { NotificationType } from '@prisma/client'
import prisma from '@/lib/prisma/client'
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

/**
 * Replaces {{handlebars}} style placeholders in a string.
 */
function replacePlaceholders(template: string, data: Record<string, any>) {
  return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const value = data[key.trim()]
    return value !== undefined ? String(value) : match
  })
}

async function getTemplate(name: string, defaults: { subject: string; body: string }) {
  try {
    const t = await prisma.emailTemplate.findUnique({
      where: { name },
    })
    if (t && t.isActive) {
      return { subject: t.subject, body: t.body }
    }
  } catch (error) {
    console.warn(`[Email] Failed to fetch template "${name}", using default:`, error)
  }
  return defaults
}

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

const COLORS = {
  navy: '#002a5c',
  sky: '#4c9ded',
  white: '#ffffff',
  gray: '#f4f6f8',
  text: '#334155',
}

export const wrapEmail = async (title: string, bodyContent: string) => {
  const baseUrl = await getBaseUrl()
  const logoDarkOnWhite = `${baseUrl}/images/logos/AATA_logo_hor_onWhite.png`
  const logoWhiteOnDark = `${baseUrl}/images/logos/ATA_logo_hor_onDark.png`

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
          .btn { background-color: ${COLORS.navy}; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; border: 2px solid ${COLORS.navy}; }
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
            <tr><td class="header"><img src="${logoDarkOnWhite}" alt="Aerojet Academy" /></td></tr>
            <tr><td class="content"><h1 class="h1">${title}</h1>${bodyContent}</td></tr>
            <tr>
              <td class="footer" bgcolor="${COLORS.navy}" style="background-color: ${COLORS.navy} !important;">
                <table width="100%">
                  <tr>
                    <td valign="top"><img src="${logoWhiteOnDark}" class="footer-logo" alt="Aerojet Academy" /></td>
                    <td valign="top" class="footer-contact" style="color: #cbd5e1 !important; text-align: right;">
                      <strong style="white-space: nowrap;">Aerojet Aviation Training Academy</strong><br/>
                      <span style="font-size: 11px; opacity: 0.8;">Small Engines Dept., ATTC<br/>Kokomlemle, Accra - Ghana<br/>+233 209 848 423</span>
                    </td>
                  </tr>
                </table>
                <div class="footer-links" style="border-top: 1px solid rgba(255,255,255,0.1) !important;">
                  <a href="${baseUrl}" style="color: ${COLORS.sky} !important;">Website</a>
                  <a href="${baseUrl}/login" style="color: ${COLORS.sky} !important;">Portal</a>
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

export async function renderRegistrationEmail(firstName: string, registrationCode: string) {
  const finance = await getFinanceConfig()
  const config = await getRegistrationConfig()

  const defaultSubject = 'Welcome to Aerojet Aviation - Registration Received'
  const defaultBody = `
    <div style="margin-bottom: 24px;">
      <div style="color: #16a34a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        ✓ Registration Received
      </div>
      <p class="text" style="font-size: 16px; color: #475569;">
        Thank you for registering. We have received your details. To proceed with your enrollment, please complete the registration fee payment using the details below.
      </p>
    </div>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0; border-left: 4px solid #137fec;">
      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px;">
        Your Reference Code
      </div>
      <div style="font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #0f172a; margin-bottom: 20px;">
        {{registrationCode}}
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
        <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Fee Amount</div>
        <div style="font-size: 20px; font-weight: 700; color: #0f172a;">{{currency}} {{fee}}</div>
      </div>
    </div>

    <!-- Payment Details Section -->
    <div style="margin-bottom: 32px;">
      <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">Bank Transfer Details</h3>
      
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Bank Name</div>
              <div style="font-size: 15px; font-weight: 700; color: #0f172a;">{{bankName}}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Account Name</div>
              <div style="font-size: 15px; font-weight: 600; color: #0f172a;">{{bankAccountName}}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Account Number</div>
              <div style="font-family: monospace; font-size: 18px; font-weight: 700; color: #0f172a;">{{bankAccountNumber}}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Branch</div>
              <div style="font-size: 15px; font-weight: 600; color: #0f172a;">{{bankBranch}}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Swift/BIC Code</div>
              <div style="font-family: monospace; font-size: 15px; font-weight: 600; color: #0f172a;">{{bankSwift}}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; background-color: #f8fafc;">
              <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Payment Reference</div>
              <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #137fec;">{{registrationCode}}</div>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div class="btn-container" style="text-align: center;">
      <a href="{{uploadUrl}}" class="btn">
        <span>Upload Payment Proof</span>
      </a>
    </div>
  `

  const template = await getTemplate('registration', { subject: defaultSubject, body: defaultBody })

  const baseUrl = await getBaseUrl()
  const body = replacePlaceholders(template.body, {
    firstName,
    registrationCode,
    currency: config.currency,
    fee: config.fee,
    bankName: finance.bankName || 'FNB Ghana',
    bankAccountName: finance.bankAccountName || 'Aerojet Aviation Foundation',
    bankAccountNumber: finance.bankAccountNumber || 'N/A',
    bankBranch: (finance as any).bankBranch || 'N/A',
    bankSwift: (finance as any).bankSwift || 'N/A',
    uploadUrl: `${baseUrl}/upload-proof?code=${registrationCode}`,
  })

  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendRegistrationEmail(
  email: string,
  firstName: string,
  registrationCode: string
) {
  // Subject placeholder replacement is handled inside renderRegistrationEmail
  const html = await renderRegistrationEmail(firstName, registrationCode)

  return sendEmail({
    to: email,
    subject: 'Welcome to Aerojet Aviation - Registration Received', // This is still used by Resend but the rendered HTML has its own title
    html,
  })
}

// ---------------------------------------------------------------------------
// EMAIL VERIFICATION (on registration, before approval)
// ---------------------------------------------------------------------------

export async function renderEmailVerificationEmail(firstName: string, verifyToken: string) {
  const defaultSubject = 'Verify Your Email — Aerojet Aviation'
  const defaultBody = `
    <p class="text">Hi {{firstName}},</p>
    <p class="text">
      Please verify your email address to continue with your application.
    </p>

    <div class="btn-container" style="text-align: center;">
      <a href="{{verifyUrl}}" class="btn">
        <span>Verify Email Address</span>
      </a>
    </div>

    <div class="info-box" style="border-left-color: #137fec;">
      <p style="margin: 0 0 10px 0;"><strong>What happens next?</strong></p>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
        <li>Get bank transfer details</li>
        <li>Upload your payment receipt</li>
        <li>Receive your portal login credentials</li>
      </ul>
    </div>

    <p class="text" style="font-size: 13px; color: #666; margin-top: 24px;">
      This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
  `

  const template = await getTemplate('email-verification', {
    subject: defaultSubject,
    body: defaultBody,
  })

  const baseUrl = await getBaseUrl()
  const body = replacePlaceholders(template.body, {
    firstName,
    verifyUrl: `${baseUrl}/verify-email?token=${verifyToken}&type=registration`,
  })

  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendEmailVerificationEmail(
  email: string,
  firstName: string,
  verifyToken: string
) {
  const html = await renderEmailVerificationEmail(firstName, verifyToken)

  return sendEmail({
    to: email,
    subject: 'Aerojet Aviation - Verify Your Email',
    html,
  })
}

// ---------------------------------------------------------------------------
// ACCOUNT ACTIVATION
// ---------------------------------------------------------------------------

export async function renderActivationEmail(
  firstName: string,
  academyEmail: string,
  tempPassword: string,
  verifyToken: string
) {
  const defaultSubject = 'Account Activated, {{firstName}}!'
  const defaultBody = `
    <p class="text">Your registration payment has been approved. You can now access the Applicant Portal.</p>
    
    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Login Credentials:</strong></div>
      <div class="info-row" style="margin-top:10px;">
        <strong>Academy Email:</strong><br/>
        <span style="font-size: 15px; color: #0f172a; font-weight:bold;">{{academyEmail}}</span>
      </div>
      <div class="info-row" style="margin-top:5px;">
        <strong>Temporary Password:</strong><br/>
        <span style="font-family: monospace; font-size: 16px; letter-spacing: 1px; color: #0f172a; background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 4px;">{{tempPassword}}</span>
      </div>
    </div>

    <p class="text" style="font-size: 13px; color: #0f172a; background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #137fec;">
      <strong>🚀 Get Started:</strong><br/>
      1. <strong>Copy</strong> your temporary password above.<br/>
      2. Click the button below to log in to your portal.<br/>
      3. Use the temporary password as your "Current Password" to set a permanent one.
    </p>

    <div class="btn-container" style="text-align: center;">
      <a href="{{loginUrl}}" class="btn">
        <span>Login &amp; Get Started</span>
      </a>
    </div>
  `

  const template = await getTemplate('activation', { subject: defaultSubject, body: defaultBody })

  const baseUrl = await getBaseUrl()
  const body = replacePlaceholders(template.body, {
    firstName,
    academyEmail,
    tempPassword,
    loginUrl: `${baseUrl}/verify-email?token=${verifyToken}`,
  })

  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendActivationEmail(
  email: string,
  firstName: string,
  academyEmail: string,
  tempPassword: string,
  verifyToken: string
) {
  const html = await renderActivationEmail(firstName, academyEmail, tempPassword, verifyToken)

  return sendEmail({
    to: email,
    subject: 'Aerojet Aviation - Account Activated',
    html,
  })
}

// ---------------------------------------------------------------------------
// STUDENT PROMOTION
// ---------------------------------------------------------------------------

export async function renderStudentPromotionEmail(firstName: string, studentId: string) {
  const defaultSubject = 'Congratulations, {{firstName}}!'
  const defaultBody = `
    <p class="text">Your course enrollment has been approved. You are now a Student at Aerojet Aviation Training Academy.</p>
    
    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Your Student ID:</strong></div>
      <div class="info-row" style="margin-top:5px;">
        <span style="font-family: monospace; font-size: 20px; letter-spacing: 2px; color: #0f172a; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 4px;">{{studentId}}</span>
      </div>
    </div>

    <p class="text" style="margin-top: 16px;">A wallet has been created for your account. You can now:</p>
    <ul style="color: #334155; line-height: 1.6; margin-bottom: 20px;">
      <li>Access course materials</li>
      <li>Book exam pool seats</li>
      <li>Track attendance and grades</li>
      <li>Manage your wallet</li>
    </ul>

    <div class="btn-container" style="text-align: center;">
      <a href="{{loginUrl}}" class="btn">
        <span>Go to Student Portal</span>
      </a>
    </div>
  `

  const template = await getTemplate('promotion', { subject: defaultSubject, body: defaultBody })

  const baseUrl = await getBaseUrl()
  const body = replacePlaceholders(template.body, {
    firstName,
    studentId,
    loginUrl: `${baseUrl}/login`,
  })

  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendStudentPromotionEmail(
  email: string,
  firstName: string,
  studentId: string
) {
  const html = await renderStudentPromotionEmail(firstName, studentId)

  return sendEmail({
    to: email,
    subject: 'Aerojet Aviation - Welcome, Student!',
    html,
  })
}

// ---------------------------------------------------------------------------
// POOL CONFIRMED
// ---------------------------------------------------------------------------

export async function renderPoolConfirmedEmail(
  firstName: string,
  poolName: string,
  module: string,
  examDate: string,
  amount: number
) {
  const defaultSubject = 'Exam Pool Confirmed!'
  const defaultBody = `
    <p class="text">Hi {{firstName}}, great news! <strong>{{poolName}}</strong> has reached the minimum candidates and is confirmed.</p>
    
    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Module:</strong> {{module}}</div>
      <div class="info-row"><strong>Exam Date:</strong> {{examDate}}</div>
      <div class="info-row"><strong>Amount Paid:</strong> {{currency}}{{amount}}</div>
    </div>

    <p class="text">{{currency}}{{amount}} has been deducted from your wallet. Please prepare for your exam.</p>
  `

  const template = await getTemplate('pool-confirmed', {
    subject: defaultSubject,
    body: defaultBody,
  })

  const body = replacePlaceholders(template.body, {
    firstName,
    poolName,
    module,
    examDate,
    amount: amount.toLocaleString(),
    currency: '€',
  })

  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendPoolConfirmedEmail(
  email: string,
  firstName: string,
  poolName: string,
  module: string,
  examDate: string,
  amount: number
) {
  const html = await renderPoolConfirmedEmail(firstName, poolName, module, examDate, amount)

  return sendEmail({
    to: email,
    subject: `Aerojet Aviation - Exam Pool Confirmed: ${poolName}`,
    html,
  })
}

// ---------------------------------------------------------------------------
// PASSWORD RESET
// ---------------------------------------------------------------------------

export async function renderPasswordResetEmail(firstName: string, resetToken: string) {
  const defaultSubject = 'Password Reset Request'
  const defaultBody = `
    <p class="text">Hi {{firstName}}, we received a request to reset your password.</p>
    
    <div class="btn-container" style="text-align: center;">
      <a href="{{resetUrl}}" class="btn">
        <span>Reset Password</span>
      </a>
    </div>

    <p class="text" style="font-size: 13px; color: #666;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
  `

  const template = await getTemplate('reset-password', {
    subject: defaultSubject,
    body: defaultBody,
  })

  const baseUrl = await getBaseUrl()
  const body = replacePlaceholders(template.body, {
    firstName,
    resetUrl: `${baseUrl}/reset-password?token=${resetToken}`,
  })

  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendPasswordResetEmail(email: string, firstName: string, resetToken: string) {
  const html = await renderPasswordResetEmail(firstName, resetToken)

  return sendEmail({
    to: email,
    subject: 'Aerojet Aviation - Password Reset',
    html,
  })
}

// ---------------------------------------------------------------------------
// PAYMENT APPROVED/REJECTED
// ---------------------------------------------------------------------------

export async function renderPaymentApprovedEmail(
  firstName: string,
  paymentType: string,
  amount: number
) {
  const defaultSubject = 'Payment Approved'
  const defaultBody = `
    <p class="text">Hi {{firstName}}, your {{paymentType}} payment of <strong>€{{amount}}</strong> has been approved.</p>
    
    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Status:</strong> <span style="color:#15803d; font-weight:bold;">PAID ✅</span></div>
      <div class="info-row" style="margin-top:5px;"><strong>Amount:</strong> €{{amount}}</div>
      <div class="info-row"><strong>Description:</strong> {{paymentType}}</div>
    </div>
  `

  const template = await getTemplate('payment-approved', {
    subject: defaultSubject,
    body: defaultBody,
  })

  const body = replacePlaceholders(template.body, {
    firstName,
    paymentType,
    amount: amount.toLocaleString(),
  })

  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendPaymentApprovedEmail(
  email: string,
  firstName: string,
  paymentType: string,
  amount: number
) {
  const html = await renderPaymentApprovedEmail(firstName, paymentType, amount)

  return sendEmail({
    to: email,
    subject: 'Aerojet Aviation - Payment Approved',
    html,
  })
}

export async function renderSeatReservationConfirmedEmail(
  firstName: string,
  programmeName: string,
  amount: number,
  currency: string
) {
  const defaultSubject = 'Seat Reservation Confirmed - Welcome to Aerojet Academy!'
  const defaultBody = `
    <p class="text">Hi {{firstName}},</p>
    
    <p class="text">Congratulations! Your seat reservation for <strong>{{programmeName}}</strong> has been confirmed.</p>
    
    <div class="info-box" style="border-left-color: #22c55e;">
      <div class="info-row"><strong>Status:</strong> <span style="color:#15803d; font-weight:bold;">SEAT CONFIRMED ✅</span></div>
      <div class="info-row" style="margin-top:5px;"><strong>Amount Paid:</strong> {{currency}}{{amount}}</div>
      <div class="info-row"><strong>Programme:</strong> {{programmeName}}</div>
    </div>

    <p class="text"><strong>What's Next?</strong></p>
    <ul style="margin-left:20px; margin-top:10px;">
      <li>Complete the remaining payments as per your payment plan</li>
      <li>Top up your wallet to pay future installments</li>
      <li>You will receive login credentials once all payments are complete</li>
    </ul>

    <p class="text">You can track your enrollment progress and make additional payments through your applicant portal.</p>

    <div class="btn-container" style="text-align: center;">
      <a href="{{portalUrl}}" class="btn">
        <span>Go to Applicant Portal</span>
      </a>
    </div>
    
    <p class="text" style="margin-top:20px;">If you have any questions, please contact our admissions team.</p>
  `

  const template = await getTemplate('seat-reservation-confirmed', {
    subject: defaultSubject,
    body: defaultBody,
  })

  const baseUrl = await getBaseUrl()
  const body = replacePlaceholders(template.body, {
    firstName,
    programmeName,
    amount: amount.toLocaleString(),
    currency,
    portalUrl: `${baseUrl}/applicant/dashboard`,
  })

  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendSeatReservationConfirmedEmail(
  email: string,
  firstName: string,
  programmeName: string,
  amount: number,
  currency: string
) {
  const html = await renderSeatReservationConfirmedEmail(firstName, programmeName, amount, currency)

  return sendEmail({
    to: email,
    subject: 'Seat Reservation Confirmed - Welcome to Aerojet Academy!',
    html,
  })
}

export async function renderPaymentRejectedEmail(
  firstName: string,
  paymentType: string,
  reason: string
) {
  const defaultSubject = 'Payment Not Approved'
  const defaultBody = `
    <p class="text">Hi {{firstName}}, your {{paymentType}} payment was not approved.</p>
    
    <div class="info-box" style="border-left-color: #ef4444;">
      <div class="info-row"><strong>Status:</strong> <span style="color:#dc2626; font-weight:bold;">REJECTED ❌</span></div>
      <div class="info-row" style="margin-top:5px;"><strong>Reason:</strong> {{reason}}</div>
    </div>

    <p class="text">Please log in to your portal and re-upload a valid payment proof or contact the admissions office.</p>

    <div class="btn-container" style="text-align: center;">
      <a href="{{loginUrl}}" class="btn">
        <span>Login to Upload Proof</span>
      </a>
    </div>
  `

  const template = await getTemplate('payment-rejected', {
    subject: defaultSubject,
    body: defaultBody,
  })

  const baseUrl = await getBaseUrl()
  const body = replacePlaceholders(template.body, {
    firstName,
    paymentType,
    reason,
    loginUrl: `${baseUrl}/login`,
  })

  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendPaymentRejectedEmail(
  email: string,
  firstName: string,
  paymentType: string,
  reason: string
) {
  const html = await renderPaymentRejectedEmail(firstName, paymentType, reason)

  return sendEmail({
    to: email,
    subject: 'Aerojet Aviation - Payment Rejected',
    html,
  })
}

// ---------------------------------------------------------------------------
// POOL FAILED
// ---------------------------------------------------------------------------

export async function renderPoolFailedEmail(firstName: string, poolName: string, examDate: string) {
  const defaultSubject = 'Exam Pool Did Not Reach Minimum'
  const defaultBody = `
    <p class="text">Hi {{firstName}}, we regret to inform you that your exam pool did not reach the minimum candidates.</p>
    
    <div class="info-box" style="border-left-color: #ef4444;">
      <div class="info-row"><strong>Pool:</strong> {{poolName}}</div>
      <div class="info-row"><strong>Exam Date:</strong> {{examDate}}</div>
    </div>

    <p class="text">Your reserved funds have been fully released back to your available balance. You can log in to join an alternative pool or request a withdrawal.</p>
  `

  const template = await getTemplate('pool-failed', {
    subject: defaultSubject,
    body: defaultBody,
  })

  const body = replacePlaceholders(template.body, { firstName, poolName, examDate })
  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendPoolFailedEmail(
  email: string,
  firstName: string,
  poolName: string,
  examDate: string
) {
  const html = await renderPoolFailedEmail(firstName, poolName, examDate)
  return sendEmail({
    to: email,
    subject: `Aerojet Aviation - Exam Pool Cancelled: ${poolName}`,
    html,
  })
}

// ---------------------------------------------------------------------------
// POOL APPROACHING CONFIRMATION (NEAR_FULL)
// ---------------------------------------------------------------------------

export async function renderPoolApproachingConfirmationEmail(
  firstName: string,
  poolName: string,
  examDate: string,
  module: string
) {
  const defaultSubject = 'Your Exam Pool is Almost Full!'
  const defaultBody = `
    <p class="text">Hi {{firstName}}, great news! <strong>{{poolName}}</strong> is nearing the minimum candidate threshold and is almost confirmed.</p>
    
    <div class="info-box" style="border-left-color: #f59e0b;">
      <div class="info-row"><strong>Module:</strong> {{module}}</div>
      <div class="info-row"><strong>Exam Date:</strong> {{examDate}}</div>
      <div class="info-row"><strong>Status:</strong> NEAR CONFIRMATION</div>
    </div>

    <p class="text">We will notify you immediately once the pool hits the minimum required candidates and your booking is confirmed.</p>
  `

  const template = await getTemplate('pool-approaching-confirmation', {
    subject: defaultSubject,
    body: defaultBody,
  })

  const body = replacePlaceholders(template.body, { firstName, poolName, examDate, module })
  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendPoolApproachingConfirmationEmail(
  email: string,
  firstName: string,
  poolName: string,
  examDate: string,
  module: string
) {
  const html = await renderPoolApproachingConfirmationEmail(firstName, poolName, examDate, module)
  return sendEmail({
    to: email,
    subject: `Aerojet Aviation - Pool Almost Confirmed: ${poolName}`,
    html,
  })
}

// ---------------------------------------------------------------------------
// EVENT GO / NO-GO OUTCOMES
// ---------------------------------------------------------------------------

export async function renderEventGoEmail(firstName: string, eventName: string) {
  const defaultSubject = 'Exam Event Confirmed (GO)'
  const defaultBody = `
    <p class="text">Hi {{firstName}}, the upcoming exam event <strong>{{eventName}}</strong> has been officially confirmed!</p>
    <p class="text">All confirmed pools within this event are now locked and finalized. Please prepare for your exams.</p>
  `
  const template = await getTemplate('event-go', { subject: defaultSubject, body: defaultBody })
  const body = replacePlaceholders(template.body, { firstName, eventName })
  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendEventGoEmail(email: string, firstName: string, eventName: string) {
  const html = await renderEventGoEmail(firstName, eventName)
  return sendEmail({
    to: email,
    subject: `Aerojet Aviation - Exam Event Confirmed: ${eventName}`,
    html,
  })
}

// ---------------------------------------------------------------------------
// PAYMENT DEADLINE REMINDERS
// ---------------------------------------------------------------------------

export async function renderPaymentDeadlineEmail(
  firstName: string,
  moduleName: string,
  eventName: string,
  daysRemaining: number,
  balance: number
) {
  const defaultSubject = `Payment Reminder: ${daysRemaining} Days Left`
  const defaultBody = `
    <p class="text">Hi {{firstName}}, this is a reminder that the payment deadline for your exam booking is approaching in <strong>{{daysRemaining}} days</strong>.</p>
    
    <div class="info-box" style="border-left-color: #f59e0b;">
      <div class="info-row"><strong>Module:</strong> {{moduleName}}</div>
      <div class="info-row"><strong>Event:</strong> {{eventName}}</div>
      <div class="info-row"><strong>Outstanding Balance:</strong> €{{balance}}</div>
    </div>

    <p class="text">If your balance is not paid by T-21, your 50% deposit will be forfeited. Please log in to complete your payment.</p>
  `

  const template = await getTemplate('payment-deadline-reminder', {
    subject: defaultSubject,
    body: defaultBody,
  })

  const body = replacePlaceholders(template.body, {
    firstName,
    moduleName,
    eventName,
    daysRemaining: daysRemaining.toString(),
    balance: balance.toFixed(2),
  })

  return await wrapEmail(
    replacePlaceholders(template.subject, { firstName, daysRemaining: daysRemaining.toString() }),
    body
  )
}

export async function sendPaymentDeadlineEmail(
  email: string,
  firstName: string,
  moduleName: string,
  eventName: string,
  daysRemaining: number,
  balance: number
) {
  const html = await renderPaymentDeadlineEmail(
    firstName,
    moduleName,
    eventName,
    daysRemaining,
    balance
  )
  return sendEmail({
    to: email,
    subject: `Aerojet Aviation - Payment Reminder (${daysRemaining} Days Left)`,
    html,
  })
}

export async function renderEventNoGoEmail(firstName: string, eventName: string) {
  const defaultSubject = 'Exam Event Cancelled (NO-GO)'
  const defaultBody = `
    <p class="text">Hi {{firstName}}, we regret to inform you that the exam event <strong>{{eventName}}</strong> has been cancelled.</p>
    <p class="text">All associated pools have failed and reserved funds have been returned to candidate wallets.</p>
  `
  const template = await getTemplate('event-nogo', { subject: defaultSubject, body: defaultBody })
  const body = replacePlaceholders(template.body, { firstName, eventName })
  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendEventNoGoEmail(email: string, firstName: string, eventName: string) {
  const html = await renderEventNoGoEmail(firstName, eventName)
  return sendEmail({ to: email, subject: `Exam Event Cancelled: ${eventName}`, html })
}

export async function renderEventPostponedEmail(
  firstName: string,
  eventName: string,
  newDate: string,
  newEndDate: string
) {
  const defaultSubject = 'Exam Event Postponed'
  const defaultBody = `
    <p class="text">Hi {{firstName}}, the exam event <strong>{{eventName}}</strong> has been postponed to ensure minimum thresholds can be met.</p>
    
    <div class="info-box" style="border-left-color: #f59e0b;">
      <div class="info-row"><strong>New Start Date:</strong> {{newDate}}</div>
      <div class="info-row"><strong>New End Date:</strong> {{newEndDate}}</div>
    </div>

    <p class="text">Your membership has been automatically rolled over. If the new dates do not work for you, you may withdraw your application through the portal.</p>
  `
  const template = await getTemplate('event-postponed', {
    subject: defaultSubject,
    body: defaultBody,
  })
  const body = replacePlaceholders(template.body, { firstName, eventName, newDate, newEndDate })
  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendEventPostponedEmail(
  email: string,
  firstName: string,
  eventName: string,
  newDate: string,
  newEndDate: string
) {
  const html = await renderEventPostponedEmail(firstName, eventName, newDate, newEndDate)
  return sendEmail({ to: email, subject: `Exam Event Postponed: ${eventName}`, html })
}

// ---------------------------------------------------------------------------
// CONTACT ENQUIRY
// ---------------------------------------------------------------------------

export async function renderContactEnquiryConfirmation(name: string, subject: string) {
  const defaultSubject = 'We received your enquiry'
  const defaultBody = `
    <p class="text">Hi {{firstName}},</p>
    <p class="text">
      Thank you for reaching out to Aerojet Aviation Training Academy. We have received your enquiry regarding <strong>{{subject}}</strong> and our admissions team will review it and get back to you as soon as possible.
    </p>
    <div class="info-box">
      <div class="info-row"><strong>Admissions Team</strong></div>
      <div class="info-row" style="margin-top:5px;">📞 +233 209 848 423</div>
      <div class="info-row">✉️ trainingprograms@aerojet-academy.com</div>
    </div>
    <p class="text" style="margin-top: 16px;">In the meantime, feel free to explore our website for more information about our programmes.</p>
  `

  const template = await getTemplate('contact', { subject: defaultSubject, body: defaultBody })

  const body = replacePlaceholders(template.body, {
    firstName: name.split(' ')[0],
    subject,
  })

  return await wrapEmail(
    replacePlaceholders(template.subject, { firstName: name.split(' ')[0] }),
    body
  )
}

export async function sendContactEnquiryConfirmation(email: string, name: string, subject: string) {
  const html = await renderContactEnquiryConfirmation(name, subject)

  return sendEmail({
    to: email,
    subject: `Aerojet Academy - Enquiry Received: ${subject}`,
    html,
  })
}

// ---------------------------------------------------------------------------
// MILESTONE PAYMENT REMINDERS
// ---------------------------------------------------------------------------

export async function renderMilestoneReminderEmail(
  firstName: string,
  milestoneType: string,
  amount: number,
  daysUntil: number,
  programmeName: string
) {
  const urgencyClass = daysUntil <= 3 ? 'danger' : daysUntil <= 7 ? 'warning' : 'info'
  const urgencyText = daysUntil <= 3 ? 'URGENT' : daysUntil <= 7 ? 'Important' : 'Reminder'

  const defaultSubject = `Payment ${urgencyText}: ${milestoneType} due in ${daysUntil} days`
  const defaultBody = `
    <p class="text">Hi {{firstName}},</p>
    
    <p class="text">This is a {{urgencyText}} about your upcoming payment for <strong>{{programmeName}}</strong>.</p>
    
    <div class="info-box" style="border-left-color: {{urgencyColor}};">
      <div class="info-row"><strong>Payment Type:</strong> {{milestoneType}}</div>
      <div class="info-row" style="margin-top:5px;"><strong>Amount Due:</strong> €{{amount}}</div>
      <div class="info-row" style="margin-top:5px;"><strong>Due In:</strong> <strong>{{daysUntil}} day{{daysUntil > 1 ? 's' : ''}}</strong></div>
    </div>

    <p class="text">Please ensure your payment is made before the due date to avoid any interruption to your studies.</p>
    
    <div class="btn-container" style="text-align: center;">
      <a href="{{portalUrl}}" class="btn">
        <span>Make Payment Now</span>
      </a>
    </div>
    
    <p class="text" style="margin-top:20px;">If you have already made this payment, please ignore this reminder.</p>
    
    <p class="text-muted" style="margin-top:20px; font-size:12px; color:#888;">
      If you have any questions, please contact our finance team.
    </p>
  `

  const urgencyColor = {
    info: '#3b82f6',
    warning: '#f59e0b',
    danger: '#ef4444',
  }[urgencyClass]

  const template = await getTemplate('milestone-reminder', {
    subject: defaultSubject,
    body: defaultBody,
  })

  const baseUrl = await getBaseUrl()
  const body = replacePlaceholders(template.body, {
    firstName,
    milestoneType,
    amount: amount.toLocaleString(),
    daysUntil: daysUntil.toString(),
    programmeName,
    urgencyText,
    urgencyColor,
    portalUrl: `${baseUrl}/student/wallet?tab=payments`,
  })

  return await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
}

export async function sendMilestoneReminderEmail(
  email: string,
  firstName: string,
  milestoneType: string,
  amount: number,
  daysUntil: number,
  programmeName: string
) {
  const html = await renderMilestoneReminderEmail(
    firstName,
    milestoneType,
    amount,
    daysUntil,
    programmeName
  )

  return sendEmail({
    to: email,
    subject: `Payment Reminder: ${milestoneType} due in ${daysUntil} days`,
    html,
  })
}

// ---------------------------------------------------------------------------
// WAITLIST PROMOTION
// ---------------------------------------------------------------------------

export async function sendWaitlistPromotionEmail(
  email: string,
  firstName: string,
  poolName: string,
  examDate: string,
  module: string
) {
  const defaultBody = `
    <p class="text">Hi {{firstName}}, great news! A spot has opened up in <strong>{{poolName}}</strong> and you've been promoted from the waitlist.</p>
    <div class="info-box">
      <div class="info-row"><strong>Pool:</strong> {{poolName}}</div>
      <div class="info-row"><strong>Module:</strong> {{module}}</div>
      <div class="info-row"><strong>Exam Date:</strong> {{examDate}}</div>
    </div>
    <p class="text">Your wallet has been charged and your seat is now reserved. Log in to view your booking details.</p>
  `
  const template = await getTemplate('waitlist-promotion', {
    subject: 'Waitlist Promotion — You Have a Seat!',
    body: defaultBody,
  })
  const body = replacePlaceholders(template.body, { firstName, poolName, examDate, module })
  const html = await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
  return sendEmail({
    to: email,
    subject: `Aerojet Aviation - Waitlist Promotion: ${poolName}`,
    html,
  })
}

// ---------------------------------------------------------------------------
// WITHDRAWAL CONFIRMATION
// ---------------------------------------------------------------------------

export async function sendWithdrawalConfirmationEmail(
  email: string,
  firstName: string,
  poolName: string,
  refundAmount: number
) {
  const defaultBody = `
    <p class="text">Hi {{firstName}}, your withdrawal from <strong>{{poolName}}</strong> has been processed.</p>
    <div class="info-box">
      <div class="info-row"><strong>Pool:</strong> {{poolName}}</div>
      <div class="info-row"><strong>Refund:</strong> €{{refundAmount}} returned to your wallet</div>
    </div>
    <p class="text">Your funds are now available in your wallet balance for future bookings.</p>
  `
  const template = await getTemplate('withdrawal-confirmation', {
    subject: 'Pool Withdrawal Confirmed',
    body: defaultBody,
  })
  const body = replacePlaceholders(template.body, {
    firstName,
    poolName,
    refundAmount: refundAmount.toFixed(2),
  })
  const html = await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
  return sendEmail({
    to: email,
    subject: `Aerojet Aviation - Withdrawal Confirmed: ${poolName}`,
    html,
  })
}

// ---------------------------------------------------------------------------
// BUNDLE PURCHASE CONFIRMATION
// ---------------------------------------------------------------------------

export async function sendBundlePurchaseEmail(
  email: string,
  firstName: string,
  bundleType: string,
  seats: number,
  amountPaid: number
) {
  const defaultBody = `
    <p class="text">Hi {{firstName}}, your {{bundleType}} exam bundle has been purchased successfully!</p>
    <div class="info-box">
      <div class="info-row"><strong>Bundle:</strong> {{bundleType}}</div>
      <div class="info-row"><strong>Seats:</strong> {{seats}}</div>
      <div class="info-row"><strong>Amount Paid:</strong> €{{amountPaid}}</div>
      <div class="info-row"><strong>Validity:</strong> 12 months from purchase</div>
    </div>
    <p class="text">You can use your bundle seats when joining exam pools. Seats are automatically consumed from your earliest-expiring bundle.</p>
  `
  const template = await getTemplate('bundle-purchase', {
    subject: 'Exam Bundle Purchased',
    body: defaultBody,
  })
  const body = replacePlaceholders(template.body, {
    firstName,
    bundleType,
    seats: seats.toString(),
    amountPaid: amountPaid.toFixed(2),
  })
  const html = await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
  return sendEmail({
    to: email,
    subject: `Aerojet Aviation - Bundle Purchased: ${bundleType}`,
    html,
  })
}

// ---------------------------------------------------------------------------
// AMBASSADOR PROMOTION
// ---------------------------------------------------------------------------

export async function sendAmbassadorPromotionEmail(
  email: string,
  firstName: string,
  bonusAmount: number
) {
  const defaultBody = `
    <p class="text">Congratulations {{firstName}}! 🎉 You've achieved <strong>Ambassador</strong> status!</p>
    <p class="text">You've successfully referred 10 candidates whose pool bookings have been confirmed. As an Ambassador, you now enjoy:</p>
    <div class="info-box" style="border-left-color: #10b981;">
      <div class="info-row"><strong>Discounted Pool Seats:</strong> €270/seat (save €30 per seat)</div>
      <div class="info-row"><strong>Wallet Bonus:</strong> €{{bonusAmount}} has been credited to your wallet</div>
      <div class="info-row"><strong>Lifetime Benefit:</strong> Discount applies to all future pool bookings</div>
    </div>
    <p class="text">Keep sharing your referral link to help other candidates access affordable exam bookings!</p>
  `
  const template = await getTemplate('ambassador-promotion', {
    subject: 'You Are Now an Ambassador!',
    body: defaultBody,
  })
  const body = replacePlaceholders(template.body, {
    firstName,
    bonusAmount: bonusAmount.toFixed(2),
  })
  const html = await wrapEmail(replacePlaceholders(template.subject, { firstName }), body)
  return sendEmail({
    to: email,
    subject: `Aerojet Aviation - Ambassador Status Achieved!`,
    html,
  })
}
