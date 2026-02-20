import prisma from '@/lib/database/prisma'

export type AnalyticsEvent =
  | 'USER_REGISTERED'
  | 'PAYMENT_RECEIVED'
  | 'ENROLLMENT_CREATED'
  | 'POOL_JOINED'
  | 'POOL_CONFIRMED'
  | 'EXAM_COMPLETED'

export async function trackEvent(event: AnalyticsEvent, data: Record<string, any> = {}) {
  // For now, use audit log as event store
  try {
    await prisma.auditLog.create({
      data: {
        action: event,
        entity: 'ANALYTICS',
        entityId: data.entityId || 'system',
        userId: data.userId && data.userId !== 'system' ? data.userId : undefined,
        changes: data,
      },
    })
  } catch (err) {
    console.error('[ANALYTICS]', err)
  }
}
