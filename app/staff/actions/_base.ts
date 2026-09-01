'use server'

import { getAuthSession, requireStaff, requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { BookingType, EnrollmentStatus, ExamCategory, PaymentStatus, UserStatus, UserRole } from '@prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { handleActionError } from '@/lib/staff/errors'
import { serializePrisma } from '@/lib/utils/serialization'

async function getRequestContext() {
  try {
    const h = await headers()
    return {
      ipAddress: h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('true-client-ip') || null,
      userAgent: h.get('user-agent') || null,
    }
  } catch {
    return { ipAddress: null, userAgent: null }
  }
}

export { getRequestContext }
