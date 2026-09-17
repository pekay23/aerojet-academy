import 'server-only'
import { Resend, type WebhookEvent } from 'resend'

// Placeholder when the key is absent (Preview/CI builds) so the Resend
// constructor doesn't throw during `next build` page-data collection.
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

/**
 * Create a new Resend webhook
 * @param endpoint The URL where Resend will send events
 * @param events List of events to subscribe to (e.g. ['email.sent', 'email.delivered'])
 */
export async function createResendWebhook(
  endpoint: string,
  events: string[] = ['email.sent', 'email.delivered', 'email.bounced']
) {
  return await resend.webhooks.create({
    endpoint,
      events: events as unknown as WebhookEvent[],
  })
}

/**
 * Retrieve a webhook by ID
 */
export async function getResendWebhook(webhookId: string) {
  return await resend.webhooks.get(webhookId)
}

/**
 * Update an existing webhook
 */
export async function updateResendWebhook(
  webhookId: string,
  options: { endpoint?: string; events?: string[]; status?: 'enabled' | 'disabled' }
) {
  return await resend.webhooks.update(webhookId, options as unknown as Parameters<typeof resend.webhooks.update>[1])
}

/**
 * List all webhooks
 */
export async function listResendWebhooks() {
  return await resend.webhooks.list()
}

/**
 * Delete a webhook
 */
export async function deleteResendWebhook(webhookId: string) {
  return await resend.webhooks.remove(webhookId)
}
