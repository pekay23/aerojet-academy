import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export type TestSessionStatus =
  'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT' | 'FLAGGED' | 'VOIDED'

export const SESSION_TRANSITIONS: Record<TestSessionStatus, TestSessionStatus[]> = {
  NOT_STARTED: ['IN_PROGRESS', 'VOIDED'],
  IN_PROGRESS: ['COMPLETED', 'TIMED_OUT', 'VOIDED', 'FLAGGED'],
  COMPLETED: ['VOIDED'],
  TIMED_OUT: ['VOIDED'],
  FLAGGED: ['IN_PROGRESS', 'VOIDED'],
  VOIDED: [],
}

export function validateSessionTransition(
  current: TestSessionStatus,
  target: TestSessionStatus
): void {
  const allowed = SESSION_TRANSITIONS[current] ?? []
  if (!allowed.includes(target)) {
    throw new Error(`Invalid session status transition: ${current} → ${target}`)
  }
}

export function getAllowedTransitions(current: TestSessionStatus): TestSessionStatus[] {
  return SESSION_TRANSITIONS[current] ?? []
}

export async function transitionExamSession(
  sessionId: string,
  target: TestSessionStatus,
  actorId: string,
  reason?: string,
  extra?: Record<string, unknown>
): Promise<{ id: string; status: TestSessionStatus }> {
  const session = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  })

  if (!session) {
    throw new Error('Session not found')
  }

  validateSessionTransition(session.status, target)

  const updated = await prismaUnfiltered.internalExamSession.update({
    where: { id: sessionId },
    data: { status: target, ...extra },
  })

  await createAuditLog({
    userId: actorId,
    action: AuditAction.SESSION_STATUS_CHANGED,
    entity: 'InternalExamSession',
    entityId: sessionId,
    description: `Session status changed: ${session.status} → ${target}${reason ? ` (${reason})` : ''}`,
    changes: { before: { status: session.status }, after: { status: target }, reason, ...extra },
  })

  return { id: updated.id, status: updated.status }
}
