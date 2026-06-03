import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { sendContactEnquiryConfirmation } from '@/lib/email/service'
import { checkRateLimit, getClientIp } from '@/lib/auth/helpers'
import { apiTooManyRequests } from '@/lib/api/response'
import { EMAIL_ADDRESSES } from '@/lib/constants/business-rules'

/** Escape HTML special characters to prevent XSS in email templates */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')

const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9+\-\s()]+$/.test(val), {
      message: 'Invalid phone number, please use only numbers and symbols like + - ()',
    }),
  subject: z.string().min(1),
  message: z.string().min(10),
  confirm_email: z.string().optional(),
  captchaToken: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting (Max 5 inquiries per IP per hour)
    const ip = getClientIp(req)
    if (!checkRateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
      return apiTooManyRequests('Too many requests. Please try again later.')
    }

    const payload = await req.json()

    // 2. Validation
    const validation = contactFormSchema.safeParse(payload)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid data provided' },
        { status: 400 }
      )
    }

    const { name, email, phone, subject, message, confirm_email, captchaToken } = validation.data

    // 3. Google reCAPTCHA Verification
    try {
      const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      })
      const verifyData = await verifyRes.json()
      if (!verifyData.success || verifyData.score < 0.5) {
        console.warn(`[RECAPTCHA FAILED] Score: ${verifyData.score}, IP: ${ip}`)
        return NextResponse.json(
          { error: 'CAPTCHA verification failed or score too low' },
          { status: 400 }
        )
      }
    } catch (err) {
      console.error('reCAPTCHA error:', err)
      return NextResponse.json({ error: 'Failed to verify CAPTCHA' }, { status: 500 })
    }

    // 4. Honeypot check
    // If the hidden field has any value, a bot filled it out.
    // Return success to trick the bot, but do not send emails.
    if (confirm_email) {
      console.log(`[SPAM BLOCKED] Honeypot triggered by IP: ${ip}, Email: ${email}`)
      return NextResponse.json({ success: true })
    }

    // Send original notification to admin
    await resend.emails.send({
      from: process.env.FROM_EMAIL || EMAIL_ADDRESSES.fromNoReply,
      to: 'trainingprograms@aerojet-academy.com',
      replyTo: email,
      subject: `Contact Form Enquiry: ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2>New Contact Enquiry</h2>
          <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
            <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
        </div>
      `,
    })

    // Send styled confirmation email to the enquirer
    await sendContactEnquiryConfirmation(email, name, subject)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
