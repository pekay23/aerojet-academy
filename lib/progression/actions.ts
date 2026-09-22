'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff, requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

/**
 * Audit 5d — year/semester advancement.
 *
 * This is an EASA Part-147 approved training facility, NOT a university:
 * there is NO GPA and no GPA-based academic standing. Advancement simply
 * moves a cohort from (year, semester) to the next term:
 *   semester 1 → semester 2 (same year)
 *   semester 2 → next year, semester 1
 * Each student's outcome is logged to AcademicProgressionLog. Students may be
 * held back (decision HELD) by passing their userIds in `holdUserIds`.
 */

function nextTerm(year: number, semester: number) {
  return semester >= 2 ? { year: year + 1, semester: 1 } : { year, semester: 2 }
}

interface AdvanceInput {
  pathwayId?: string
  academicYearId?: string
  fromYear: number
  fromSemester: number
  holdUserIds?: string[]
}

/** Preview how many students an advancement run would affect (staff). */
export async function previewAdvancement(input: AdvanceInput) {
  try {
    await requireStaff()
    const count = await prismaUnfiltered.studentProfile.count({
      where: {
        currentYearNumber: input.fromYear,
        currentSemesterNumber: input.fromSemester,
        enrollmentStatus: { in: ['ENROLLED', 'ACTIVE', 'APPROVED'] },
        ...(input.pathwayId ? { pathwayId: input.pathwayId } : {}),
        ...(input.academicYearId ? { academicYearId: input.academicYearId } : {}),
      },
    })
    const to = nextTerm(input.fromYear, input.fromSemester)
    return { success: true, count, to }
  } catch (e) {
    console.error('[previewAdvancement]', e)
    return { error: 'Failed to preview advancement.' }
  }
}

/** Execute the advancement run (admin only — bulk, hard to reverse). */
export async function runAdvancement(input: AdvanceInput) {
  try {
    const admin = await requireAdmin()
    const to = nextTerm(input.fromYear, input.fromSemester)
    const runRef = `ADV-${Date.now()}`

    const profiles = await prismaUnfiltered.studentProfile.findMany({
      where: {
        currentYearNumber: input.fromYear,
        currentSemesterNumber: input.fromSemester,
        enrollmentStatus: { in: ['ENROLLED', 'ACTIVE', 'APPROVED'] },
        ...(input.pathwayId ? { pathwayId: input.pathwayId } : {}),
        ...(input.academicYearId ? { academicYearId: input.academicYearId } : {}),
      },
      select: { id: true, userId: true },
    })

    const validUserIds = new Set(profiles.map((p) => p.userId))
    const holdUserIds = input.holdUserIds ?? []
    const invalidIds = holdUserIds.filter((id) => !validUserIds.has(id))
    if (invalidIds.length > 0) {
      return { error: `Invalid hold user IDs not found in cohort: ${invalidIds.join(', ')}` }
    }
    const hold = new Set(holdUserIds)

    let advanced = 0
    let held = 0

    await prismaUnfiltered.$transaction(async (tx) => {
      for (const p of profiles) {
        const isHeld = hold.has(p.userId)
        if (!isHeld) {
          await tx.studentProfile.update({
            where: { id: p.id },
            data: { currentYearNumber: to.year, currentSemesterNumber: to.semester },
          })
          advanced++
        } else {
          held++
        }
        await tx.academicProgressionLog.create({
          data: {
            userId: p.userId,
            runRef,
            fromYear: input.fromYear,
            fromSemester: input.fromSemester,
            toYear: isHeld ? input.fromYear : to.year,
            toSemester: isHeld ? input.fromSemester : to.semester,
            decision: isHeld ? 'HELD' : 'ADVANCED',
            decidedById: admin.id,
          },
        })
      }
    })

    await createAuditLog({
      action: AuditAction.SYSTEM_UPDATE,
      entity: 'StudentProfile',
      entityId: runRef,
      userId: admin.id,
      description: `Advancement run ${runRef}: ${advanced} advanced, ${held} held.`,
      changes: { ...input, advanced, held, to },
    })

    revalidatePath('/staff/enrollments/advancement')
    return { success: true, advanced, held }
  } catch (e) {
    console.error('[runAdvancement]', e)
    return { error: 'Failed to run advancement.' }
  }
}
