import { Resend } from 'resend'
import type { EmailOptions, EmailResult } from './types'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const DEFAULT_FROM = 'Aerojet Academy <admissions@mail.aerojet-academy.com>'

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, from = DEFAULT_FROM, replyTo } = options

  // Dev fallback: log to console if no API key
  if (!resend) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`)
    console.log(`[EMAIL] Body preview: ${html.substring(0, 200)}...`)
    return { success: true, messageId: `dev-${Date.now()}` }
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    })

    if (error) {
      console.error('[EMAIL ERROR]', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (err: any) {
    console.error('[EMAIL ERROR]', err)
    return { success: false, error: err.message }
  }
}

export async function sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
  return Promise.all(emails.map(sendEmail))
}
