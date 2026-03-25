import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { env } from '@/lib/env'

// Cron job: Expire bundles past their validity date
// ACTIVE bundles with validUntil < now → mark EXPIRED
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find bundles about to expire so we can notify their owners
    const expiredBundles = await prisma.examBundle.findMany({
      where: {
        status: 'ACTIVE',
        validUntil: { lt: new Date() },
      },
      select: { id: true, userId: true, bundleType: true },
    })

    const result = await prisma.examBundle.updateMany({
      where: {
        id: { in: expiredBundles.map((b) => b.id) },
      },
      data: { status: 'EXPIRED' },
    })

    if (result.count > 0) {
      // Notify each user whose bundle expired
      for (const bundle of expiredBundles) {
        await prisma.notification.create({
          data: {
            userId: bundle.userId,
            title: 'Exam Bundle Expired',
            message: `Your ${bundle.bundleType} exam bundle has expired. Contact admin for renewal options.`,
            type: 'WARNING',
          },
        }).catch(() => {}) // Don't fail the cron if notification fails
      }

      await createAuditLog({
        action: 'SYSTEM_UPDATE' as any,
        entity: 'ExamBundle',
        entityId: 'cron',
        description: `Expired ${result.count} bundle(s) past validity date`,
      })
    }

    return NextResponse.json({
      success: true,
      expired: result.count,
    })
  } catch (error: any) {
    console.error('[CRON] expire-bundles error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
