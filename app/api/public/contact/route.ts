import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { sendContactEnquiryConfirmation } from '@/lib/email/service'
import { checkRateLimit, getClientIp } from '@/lib/auth/helpers'
import { apiTooManyRequests } from '@/lib/api/response'

const resend = new Resend(process.env.RESEND_API_KEY)

const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  subject: z.string().min(1),
  message: z.string().min(10),
  confirm_email: z.string().optional(),
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
        { error: validation.error.errors[0]?.message || 'Invalid data provided' },
        { status: 400 }
      )
    }

    const { name, email, phone, subject, message, confirm_email } = validation.data

    // 3. Honeypot check
    // If the hidden field has any value, a bot filled it out.
    // Return success to trick the bot, but do not send emails.
    if (confirm_email) {
      console.log(`[SPAM BLOCKED] Honeypot triggered by IP: ${ip}, Email: ${email}`)
      return NextResponse.json({ success: true })
    }

    // Send original notification to admin
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@aerojet-academy.com',
      to: 'trainingprograms@aerojet-academy.com',
      replyTo: email,
      subject: `Contact Form Enquiry: ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2>New Contact Enquiry</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
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
