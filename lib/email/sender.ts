import 'server-only'
import { Resend } from 'resend'
import { EMAIL_ADDRESSES } from '@/lib/constants/business-rules'
import { prismaUnfiltered } from '@/lib/prisma/client'
import type { EmailOptions, EmailResult } from './types'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const DEFAULT_FROM = process.env.FROM_EMAIL || EMAIL_ADDRESSES.fromTransactional

/** Total attempts including the first; bumped from 1 to harden the
 *  verify-email path against transient Resend / network failures. */
const MAX_ATTEMPTS = 3

/** Initial backoff in ms; doubles each retry (300 → 600 → 1200). */
const INITIAL_BACKOFF_MS = 300

function isRetryable(err: unknown): boolean {
  if (!err) return false
  const message = String((err as { message?: string }).message || err)
  // Resend returns these names for transient conditions
  if (/rate_limit|timeout|ECONN|ETIMEDOUT|ENETUNREACH|fetch failed/i.test(message)) return true
  const status = (err as { statusCode?: number; status?: number }).statusCode ?? (err as { status?: number }).status
  return typeof status === 'number' && (status === 429 || status >= 500)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Best-effort write to the EmailDelivery log. Never throws — a logging
 *  failure must not break the actual send pipeline. */
async function recordDelivery(args: {
  recipient: string
  subject: string
  template?: string
  userId?: string
  status: 'SUCCESS' | 'FAILED'
  messageId?: string | null
  error?: string | null
  attempts: number
}) {
  try {
    await prismaUnfiltered.emailDelivery.create({
      data: {
        recipient: args.recipient,
        subject: args.subject,
        template: args.template ?? null,
        userId: args.userId ?? null,
        status: args.status,
        messageId: args.messageId ?? null,
        error: args.error ?? null,
        attempts: args.attempts,
      },
    })
  } catch (err) {
    console.error('[email-delivery-log] failed to record:', err)
  }
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, from = DEFAULT_FROM, replyTo, template, userId } = options
  const recipient = Array.isArray(to) ? to.join(', ') : to

  // Dev fallback: log to console if no API key, and skip the DB write.
  if (!resend) {
    console.log(`[EMAIL] To: ${recipient} | Subject: ${subject}`)
    console.log(`[EMAIL] Body preview: ${html.substring(0, 200)}...`)
    return { success: true, messageId: `dev-${Date.now()}` }
  }

  let lastError: unknown = null
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        replyTo,
      })

      if (error) {
        lastError = error
        if (attempt < MAX_ATTEMPTS && isRetryable(error)) {
          const backoff = INITIAL_BACKOFF_MS * 2 ** (attempt - 1)
          console.warn(`[EMAIL] retry ${attempt}/${MAX_ATTEMPTS} after ${backoff}ms · ${recipient} · ${error.message}`)
          await sleep(backoff)
          continue
        }
        console.error('[EMAIL ERROR]', { recipient, subject, attempt, error })
        await recordDelivery({
          recipient,
          subject,
          template,
          userId,
          status: 'FAILED',
          error: error.message,
          attempts: attempt,
        })
        return { success: false, error: error.message }
      }

      if (attempt > 1) {
        console.info(`[EMAIL] delivered on attempt ${attempt} · ${recipient} · ${data?.id}`)
      }
      await recordDelivery({
        recipient,
        subject,
        template,
        userId,
        status: 'SUCCESS',
        messageId: data?.id ?? null,
        attempts: attempt,
      })
      return { success: true, messageId: data?.id }
    } catch (err: unknown) {
      lastError = err
      if (attempt < MAX_ATTEMPTS && isRetryable(err)) {
        const backoff = INITIAL_BACKOFF_MS * 2 ** (attempt - 1)
        console.warn(`[EMAIL] retry ${attempt}/${MAX_ATTEMPTS} after ${backoff}ms · ${recipient} · ${(err as Error).message}`)
        await sleep(backoff)
        continue
      }
      console.error('[EMAIL ERROR]', { recipient, subject, attempt, err })
      await recordDelivery({
        recipient,
        subject,
        template,
        userId,
        status: 'FAILED',
        error: (err as Error).message,
        attempts: attempt,
      })
      return { success: false, error: (err as Error).message }
    }
  }

  const finalError = `Exhausted ${MAX_ATTEMPTS} attempts: ${(lastError as Error)?.message ?? 'unknown'}`
  await recordDelivery({
    recipient,
    subject,
    template,
    userId,
    status: 'FAILED',
    error: finalError,
    attempts: MAX_ATTEMPTS,
  })
  return { success: false, error: finalError }
}

export async function sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
  return Promise.all(emails.map(sendEmail))
}
