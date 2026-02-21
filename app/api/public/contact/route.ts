import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sendContactEnquiryConfirmation } from '@/lib/email/service'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await req.json()

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter a valid name' }, { status: 400 })
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }
    if (!subject) {
      return NextResponse.json({ error: 'Please select a subject' }, { status: 400 })
    }
    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters long' },
        { status: 400 }
      )
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
