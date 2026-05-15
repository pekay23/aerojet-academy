import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const entrySchema = z.object({
  date: z.string(),
  aircraftType: z.string().min(1),
  aircraftRegistration: z.string().min(1),
  ataChapterId: z.string(),
  taskDescription: z.string().min(1),
  workOrderReference: z.string().optional(),
  maintenanceManualRef: z.string().optional(),
  maintenanceType: z.enum(['LINE', 'BASE']),
  durationHours: z.number().min(0.25),
  supervisorId: z.string(),
})

// GET — get logbook detail with entries
export const GET = withErrorHandler(async (_req: NextRequest, ctx: any) => {
  await requireStaff()
  const { logbookId } = await ctx.params

  const logbook = await prismaUnfiltered.oJTLogbook.findUnique({
    where: { id: logbookId },
    include: {
      studentProfile: {
        select: {
          studentId: true,
          user: { select: { profile: { select: { firstName: true, lastName: true } } } },
        },
      },
      mentorAssignments: true,
      entries: {
        include: { ataChapter: { select: { code: true, title: true } } },
        orderBy: { date: 'desc' },
      },
    },
  })

  if (!logbook) return apiError('Logbook not found', 404)

  // Calculate experience duration
  const startDate = logbook.startDate
  const now = new Date()
  const monthsExperience = Math.floor((now.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000))

  // Total hours
  const totalHours = logbook.entries.reduce((sum, e) => sum + e.durationHours, 0)

  // ATA chapter coverage
  const coveredChapters = new Set(logbook.entries.map(e => e.ataChapterId))

  // Line vs base maintenance split
  const lineHours = logbook.entries.filter(e => e.maintenanceType === 'LINE').reduce((s, e) => s + e.durationHours, 0)
  const baseHours = logbook.entries.filter(e => e.maintenanceType === 'BASE').reduce((s, e) => s + e.durationHours, 0)

  return apiSuccess({
    ...logbook,
    analytics: {
      monthsExperience,
      totalHours: Math.round(totalHours * 10) / 10,
      lineHours: Math.round(lineHours * 10) / 10,
      baseHours: Math.round(baseHours * 10) / 10,
      ataChaptersCovered: coveredChapters.size,
      signedEntries: logbook.entries.filter(e => e.supervisorSignature && e.studentSignature).length,
      unsignedEntries: logbook.entries.filter(e => !e.supervisorSignature || !e.studentSignature).length,
    },
  })
})

// POST — add logbook entry
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  const { logbookId } = await ctx.params
  const body = await req.json()
  const parsed = entrySchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const logbook = await prismaUnfiltered.oJTLogbook.findUnique({ where: { id: logbookId } })
  if (!logbook) return apiError('Logbook not found', 404)
  if (logbook.status !== 'ACTIVE') return apiError('Logbook is not active')

  const entry = await prismaUnfiltered.oJTLogbookEntry.create({
    data: {
      logbookId,
      date: new Date(parsed.data.date),
      aircraftType: parsed.data.aircraftType,
      aircraftRegistration: parsed.data.aircraftRegistration,
      ataChapterId: parsed.data.ataChapterId,
      taskDescription: parsed.data.taskDescription,
      workOrderReference: parsed.data.workOrderReference || null,
      maintenanceManualRef: parsed.data.maintenanceManualRef || null,
      maintenanceType: parsed.data.maintenanceType as any,
      durationHours: parsed.data.durationHours,
      supervisorId: parsed.data.supervisorId,
    },
  })

  // Update total hours on logbook
  await prismaUnfiltered.oJTLogbook.update({
    where: { id: logbookId },
    data: { totalLoggedHours: { increment: parsed.data.durationHours } },
  })

  return apiCreated(entry)
})
