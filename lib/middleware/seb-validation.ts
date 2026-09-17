import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { verifySebRequestHash, BekPair } from '@/lib/internal-exam/seb-config'

const SEB_BEK_TTL_MS = 24 * 60 * 60 * 1000

interface SebKeysStored {
  publicKey: string
  privateKey: string
  configKey: string
  createdAt?: string
}

export class SebValidationError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

export async function validateSebRequest(sessionId: string, req: Request): Promise<BekPair> {
  const session = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { sebKeys: true, bankId: true, classId: true, expiresAt: true },
  })

  if (!session) {
    throw new SebValidationError(404, 'Session not found')
  }

  if (!session.classId || !session.bankId) {
    throw new SebValidationError(400, 'Session is not tied to a scheduled exam')
  }

  const schedule = await prismaUnfiltered.internalExamClassSchedule.findFirst({
    where: { bankId: session.bankId, classId: session.classId },
    select: { sebRequired: true },
  })

  if (!schedule || !schedule.sebRequired) {
    throw new SebValidationError(403, 'SEB is not required for this exam schedule')
  }

  const storedKeys = session.sebKeys as SebKeysStored | null
  if (!storedKeys?.configKey || !storedKeys?.publicKey || !storedKeys?.privateKey) {
    throw new SebValidationError(403, 'No SEB configuration found for this session')
  }

  if (storedKeys.createdAt) {
    const age = Date.now() - new Date(storedKeys.createdAt).getTime()
    if (age > SEB_BEK_TTL_MS) {
      throw new SebValidationError(403, 'SEB configuration has expired')
    }
  }

  const requestHash = req.headers.get('x-safeexambrowser-requesthash')
  if (!requestHash) {
    throw new SebValidationError(403, 'Missing SEB request hash')
  }

  const bekPair: BekPair = {
    publicKey: storedKeys.publicKey,
    privateKey: storedKeys.privateKey,
    configKey: storedKeys.configKey,
  }

  const startUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/exams/internal/take/${sessionId}`
  const examDurationSecs = session.expiresAt
    ? Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000))
    : 0

  const isValid = verifySebRequestHash(requestHash, bekPair, startUrl, examDurationSecs)
  if (!isValid) {
    throw new SebValidationError(403, 'Invalid SEB request hash')
  }

  return bekPair
}

export function requireSebValidation(sessionIdParam: string) {
  return async (req: Request): Promise<BekPair> => {
    return validateSebRequest(sessionIdParam, req)
  }
}
