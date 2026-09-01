'use server'

import { revalidatePath } from 'next/cache'
import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

const PASS_MARK = 75

function letterGrade(pct: number): string {
  if (pct >= 90) return 'A'
  if (pct >= 80) return 'B'
  if (pct >= PASS_MARK) return 'C'
  return 'F'
}

interface ResultEntry {
  assignmentId: string
  score: number | null
  absent?: boolean
}

/**
 * Audit 7a: examiners administer start/stop of exams on the external
 * suntech-bc.com portal. On Aerojet Academy they only upload or individually
 * enter the results for sittings assigned to them.
 */
export async function submitExaminerResults(sittingId: string, entries: ResultEntry[]) {
  try {
    const user = await requireExaminer()

    const examiner = await prismaUnfiltered.examiner.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!examiner) return { error: 'Examiner profile not found.' }

    const sitting = await prismaUnfiltered.examSitting.findUnique({
      where: { id: sittingId },
      select: {
        id: true,
        examinerId: true,
        examComponent: { select: { course: { select: { code: true } } } },
        assignments: {
          select: { id: true, userId: true, bookingId: true, booking: { select: { examId: true, moduleCode: true } } },
        },
      },
    })
    if (!sitting) return { error: 'Sitting not found.' }
    if (sitting.examinerId !== examiner.id) {
      return { error: 'You are not assigned to this sitting.' }
    }

    const assignmentMap = new Map(sitting.assignments.map((a) => [a.id, a]))
    let recorded = 0

    await prismaUnfiltered.$transaction(async (tx) => {
      for (const entry of entries) {
        const assignment = assignmentMap.get(entry.assignmentId)
        if (!assignment) continue

        if (entry.absent) {
          await tx.examSittingAssignment.update({
            where: { id: assignment.id },
            data: { attendanceStatus: 'ABSENT' },
          })
          continue
        }
        if (entry.score == null || Number.isNaN(entry.score)) continue

        const score = Math.max(0, Math.min(100, entry.score))
        const passed = score >= PASS_MARK
        const moduleCode =
          assignment.booking?.moduleCode ?? sitting.examComponent?.course?.code ?? null

        const existing = await tx.examResult.findFirst({
          where: {
            userId: assignment.userId,
            ...(assignment.booking?.examId
              ? { examId: assignment.booking.examId }
              : { moduleCode: moduleCode ?? undefined }),
          },
        })

        const data = {
          score,
          maxScore: 100,
          percentage: score,
          passed,
          grade: letterGrade(score),
          moduleCode,
          examCategory: 'OFFICIAL_EASA' as const,
          sourceNotes: `Entered by examiner ${user.name ?? user.id}`,
        }

        if (existing) {
          await tx.examResult.update({ where: { id: existing.id }, data })
        } else {
          await tx.examResult.create({
            data: {
              userId: assignment.userId,
              examId: assignment.booking?.examId ?? null,
              ...data,
            },
          })
        }

        await tx.examSittingAssignment.update({
          where: { id: assignment.id },
          data: { attendanceStatus: 'PRESENT' },
        })
        recorded++
      }
    })

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'ExamResult',
      entityId: sittingId,
      userId: user.id,
      description: `Examiner recorded ${recorded} result(s) for sitting ${sittingId}.`,
      changes: { sittingId, recorded },
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
    })

    revalidatePath('/examiner/results')
    revalidatePath('/staff/exams')
    return { success: true, recorded }
  } catch (error) {
    console.error('[submitExaminerResults] Exception:', error)
    return { error: 'Failed to submit results.' }
  }
}
