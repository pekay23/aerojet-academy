import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await resend.emails.send({
      from: process.env.FROM_EMAIL as string,
      to: 'trainingprograms@aerojet-academy.com',
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #002a5c; padding: 24px 32px;">
            <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">
              New Contact Enquiry
            </h1>
          </div>
          <div style="padding: 32px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; width: 120px;">Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; font-size: 13px;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; font-size: 13px;">${email}</td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">Phone</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; font-size: 13px;">${phone}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">Subject</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; font-size: 13px;">${subject}</td>
              </tr>
            </table>
            <div style="margin-top: 24px;">
              <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">Message</p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; color: #0f172a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
            </div>
          </div>
          <div style="padding: 16px 32px; background: #f1f5f9; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">
              Aerojet Aviation Training Academy — Contact Form
            </p>
          </div>
        </div>
      `,
    })

    // Send confirmation email to the enquirer
    await resend.emails.send({
      from: process.env.FROM_EMAIL as string,
      to: email,
      subject: `We received your enquiry — Aerojet Academy`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #002a5c; padding: 24px 32px;">
            <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">
              Aerojet Academy
            </h1>
          </div>
          <div style="padding: 32px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <p style="color: #0f172a; font-size: 15px; margin: 0 0 16px;">Hi ${name.split(' ')[0]},</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
              Thank you for reaching out. We have received your enquiry regarding <strong>${subject}</strong> and our admissions team will get back to you as soon as possible.
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              In the meantime, you can reach us directly at:
            </p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #475569;">📞 +233-20-984-8423</p>
              <p style="margin: 0; font-size: 13px; color: #475569;">✉️ trainingprograms@aerojet-academy.com</p>
            </div>
          </div>
          <div style="padding: 16px 32px; background: #f1f5f9; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">
              Aerojet Aviation Training Academy, Kokomlemle, Accra, Ghana
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
