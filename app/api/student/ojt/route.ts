import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'

// GET — get the current student's OJT logbook with entries
export const GET = withErrorHandler(async () => {
  const user = await requireAuth()

  const studentProfile = await prismaUnfiltered.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  if (!studentProfile) return apiError('Student profile not found', 404)

  const logbook = await prismaUnfiltered.oJTLogbook.findUnique({
    where: { studentProfileId: studentProfile.id },
    include: {
      entries: {
        include: { ataChapter: { select: { code: true, title: true, category: true } } },
        orderBy: { date: 'desc' },
      },
      mentorAssignments: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  })

  if (!logbook) return apiSuccess(null)

  // Calculate analytics
  const totalHours = logbook.entries.reduce((s, e) => s + e.durationHours, 0)
  const hoursByType: Record<string, number> = {}
  for (const e of logbook.entries) {
    hoursByType[e.maintenanceType] = (hoursByType[e.maintenanceType] || 0) + e.durationHours
  }
  const coveredChapters = new Set(logbook.entries.map((e) => e.ataChapterId))
  const signedCount = logbook.entries.filter((e) => e.supervisorSignature && e.studentSignature).length

  return apiSuccess({
    ...logbook,
    analytics: {
      totalHours: Math.round(totalHours * 10) / 10,
      hoursByType: Object.fromEntries(
        Object.entries(hoursByType).map(([k, v]) => [k, Math.round(v * 10) / 10])
      ),
      ataChaptersCovered: coveredChapters.size,
      signedEntries: signedCount,
      unsignedEntries: logbook.entries.length - signedCount,
    },
  })
})

// POST — student signs an entry (their own signature only)
const signSchema = z.object({
  entryId: z.string(),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth()
  const body = await req.json()
  const parsed = signSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const studentProfile = await prismaUnfiltered.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  if (!studentProfile) return apiError('Student profile not found', 404)

  // Verify the entry belongs to this student's logbook
  const entry = await prismaUnfiltered.oJTLogbookEntry.findUnique({
    where: { id: parsed.data.entryId },
    include: { logbook: { select: { studentProfileId: true } } },
  })
  if (!entry || entry.logbook.studentProfileId !== studentProfile.id) {
    return apiError('Entry not found', 404)
  }

  const updated = await prismaUnfiltered.oJTLogbookEntry.update({
    where: { id: parsed.data.entryId },
    data: {
      studentSignature: true,
      studentSignedAt: new Date(),
    },
  })

  return apiCreated(updated)
})
