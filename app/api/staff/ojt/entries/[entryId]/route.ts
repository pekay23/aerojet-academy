import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const entryUpdateSchema = z.object({
  date: z.string(),
  aircraftType: z.string().min(1),
  aircraftRegistration: z.string().min(1),
  ataChapterId: z.string(),
  taskDescription: z.string().min(1),
  workOrderReference: z.string().optional().nullable(),
  maintenanceManualRef: z.string().optional().nullable(),
  maintenanceType: z.string(),
  durationHours: z.number().min(0.25),
  supervisorId: z.string(),
  licenceCategory: z.string().optional().nullable(),
  workEnvironment: z.string().optional().nullable(),
  toolsUsed: z.string().optional().nullable(),
  partNumbersUsed: z.string().optional().nullable(),
  safetyPrecautions: z.string().optional().nullable(),
})

// PUT — Update OJT Entry
export const PUT = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  const { entryId } = await ctx.params
  const body = await req.json()
  const parsed = entryUpdateSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input fields')

  const entry = await prismaUnfiltered.oJTLogbookEntry.findUnique({ where: { id: entryId } })
  if (!entry) return apiError('Entry not found', 404)

  const updated = await prismaUnfiltered.$transaction(async (tx) => {
    // Perform update
    const u = await tx.oJTLogbookEntry.update({
      where: { id: entryId },
      data: {
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

    // Recalculate parent logbook total hours
    const aggregations = await tx.oJTLogbookEntry.aggregate({
      where: { logbookId: entry.logbookId },
      _sum: { durationHours: true },
    })

    await tx.oJTLogbook.update({
      where: { id: entry.logbookId },
      data: { totalLoggedHours: aggregations._sum.durationHours || 0 },
    })

    return u
  })

  return apiSuccess(updated)
})

// DELETE — Delete OJT Entry
export const DELETE = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  const { entryId } = await ctx.params

  const entry = await prismaUnfiltered.oJTLogbookEntry.findUnique({ where: { id: entryId } })
  if (!entry) return apiError('Entry not found', 404)

  await prismaUnfiltered.$transaction(async (tx) => {
    // Delete entry
    await tx.oJTLogbookEntry.delete({ where: { id: entryId } })

    // Recalculate parent logbook total hours
    const aggregations = await tx.oJTLogbookEntry.aggregate({
      where: { logbookId: entry.logbookId },
      _sum: { durationHours: true },
    })

    await tx.oJTLogbook.update({
      where: { id: entry.logbookId },
      data: { totalLoggedHours: aggregations._sum.durationHours || 0 },
    })
  })

  return apiSuccess({ message: 'Entry deleted successfully' })
})
