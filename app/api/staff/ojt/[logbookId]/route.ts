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
  maintenanceType: z.enum([
    'LINE',
    'BASE',
    'COMPONENT_OVERHAUL',
    'ENGINE_OVERHAUL',
    'MODIFICATION',
    'REPAIR',
    'TROUBLESHOOTING',
    'INSPECTION',
    'SERVICING',
    'NDT',
  ]),
  durationHours: z.number().min(0.25),
  supervisorId: z.string(),
  // EASA Part-66 experience logbook fields
  licenceCategory: z.string().optional(),
  workEnvironment: z.string().optional(),
  toolsUsed: z.string().optional(),
  partNumbersUsed: z.string().optional(),
  safetyPrecautions: z.string().optional(),
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
  const monthsExperience = Math.floor(
    (now.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
  )

  // Total hours
  const totalHours = logbook.entries.reduce((sum, e) => sum + e.durationHours, 0)

  // ATA chapter coverage
  const coveredChapters = new Set(logbook.entries.map((e) => e.ataChapterId))

  // Maintenance type breakdown
  const hoursByType: Record<string, number> = {}
  for (const e of logbook.entries) {
    hoursByType[e.maintenanceType] = (hoursByType[e.maintenanceType] || 0) + e.durationHours
  }

  const lineHours = hoursByType['LINE'] || 0
  const baseHours = hoursByType['BASE'] || 0

  return apiSuccess({
    ...logbook,
    analytics: {
      monthsExperience,
      totalHours: Math.round(totalHours * 10) / 10,
      lineHours: Math.round(lineHours * 10) / 10,
      baseHours: Math.round(baseHours * 10) / 10,
      hoursByType: Object.fromEntries(
        Object.entries(hoursByType).map(([k, v]) => [k, Math.round(v * 10) / 10])
      ),
      ataChaptersCovered: coveredChapters.size,
      signedEntries: logbook.entries.filter((e) => e.supervisorSignature && e.studentSignature)
        .length,
      unsignedEntries: logbook.entries.filter((e) => !e.supervisorSignature || !e.studentSignature)
        .length,
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
      licenceCategory: parsed.data.licenceCategory || null,
      workEnvironment: parsed.data.workEnvironment || null,
      toolsUsed: parsed.data.toolsUsed || null,
      partNumbersUsed: parsed.data.partNumbersUsed || null,
      safetyPrecautions: parsed.data.safetyPrecautions || null,
    },
  })

  // Update total hours on logbook
  await prismaUnfiltered.oJTLogbook.update({
    where: { id: logbookId },
    data: { totalLoggedHours: { increment: parsed.data.durationHours } },
  })

  return apiCreated(entry)
})
