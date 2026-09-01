'use server'

import { revalidatePath } from 'next/cache'
import { ExamAttendanceStatus, ExamCategory, Prisma } from '@prisma/client'
import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { trackExamCompletion } from '@/lib/analytics/events'
import { trackExamCompletion } from '@/lib/analytics/events'

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
  absent: boolean
}

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
    const validEntries = entries.filter((e) => assignmentMap.has(e.assignmentId))

    if (validEntries.length === 0) {
      return { error: 'No valid entries provided.' }
    }

    const userIds = validEntries.map((e) => assignmentMap.get(e.assignmentId)!.userId)
    const existingResults = await prismaUnfiltered.examResult.findMany({
      where: {
        userId: { in: userIds },
        examCategory: 'OFFICIAL_EASA',
      },
      select: { id: true, userId: true, moduleCode: true, examId: true },
    })

    const existingByKey = new Map<string, { id: string }>()
    for (const r of existingResults) {
      const key = `${r.userId}:${r.moduleCode ?? ''}:${r.examId ?? ''}`
      existingByKey.set(key, { id: r.id })
    }

    const toCreate: { userId: string; examId: string | null; score: number; maxScore: number; percentage: number; passed: boolean; grade: string; moduleCode: string | null; examCategory: string; sourceNotes: string }[] = []
    const toUpdate: { id: string; score: number; maxScore: number; percentage: number; passed: boolean; grade: string; sourceNotes: string }[] = []
    const toClear: string[] = []
    let recorded = 0

    for (const entry of validEntries) {
      const assignment = assignmentMap.get(entry.assignmentId)!
      const moduleCode = assignment.booking?.moduleCode ?? sitting.examComponent?.course?.code ?? null

      if (entry.absent) {
        toClear.push(assignment.id)
        continue
      }

      if (entry.score == null || Number.isNaN(entry.score)) {
        toClear.push(assignment.id)
        continue
      }

      const score = Math.max(0, Math.min(100, entry.score))
      const passed = score >= PASS_MARK
      const data = {
        score,
        maxScore: 100,
        percentage: score,
        passed,
        grade: letterGrade(score),
        sourceNotes: `Entered by examiner ${user.name ?? user.id}`,
      }

      const lookupKey = `${assignment.userId}:${moduleCode ?? ''}:${assignment.booking?.examId ?? ''}`
      const existing = existingByKey.get(lookupKey)

      if (existing) {
        toUpdate.push({ id: existing.id, ...data })
      } else {
        toCreate.push({
          userId: assignment.userId,
          examId: assignment.booking?.examId ?? null,
          moduleCode,
          examCategory: 'OFFICIAL_EASA',
          ...data,
        })
      }

      trackExamCompletion(assignment.booking?.examId ?? 'unknown', moduleCode ?? 'unknown', score, passed, assignment.userId).catch(() => {})
      recorded++
    }

    await prismaUnfiltered.$transaction(async (tx) => {
      if (toCreate.length > 0) {
        await tx.examResult.createMany({
          data: toCreate.map((item) => ({
            ...item,
            examCategory: item.examCategory as ExamCategory,
          })),
        })
      }
      if (toUpdate.length > 0) {
        for (const u of toUpdate) {
          await tx.examResult.update({ where: { id: u.id }, data: u })
        }
      }
      if (toClear.length > 0) {
        await tx.examSittingAssignment.updateMany({
          where: { id: { in: toClear } },
          data: { attendanceStatus: 'PENDING' as ExamAttendanceStatus },
        })
        const userIdsToClear = toClear.map((id) => assignmentMap.get(id)!.userId)
        await tx.examResult.deleteMany({
          where: {
            userId: { in: userIdsToClear },
            examCategory: 'OFFICIAL_EASA',
            sourceNotes: { startsWith: `Entered by examiner ${user.name ?? user.id}` },
          },
        })
      }
      const presentIds = validEntries.filter((e) => !e.absent && e.score != null && !Number.isNaN(e.score)).map((e) => e.assignmentId)
      if (presentIds.length > 0) {
        await tx.examSittingAssignment.updateMany({
          where: { id: { in: presentIds } },
          data: { attendanceStatus: 'PRESENT' as const },
        })
      }
    })

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'ExamResult',
      entityId: sittingId,
      userId: user.id,
      description: `Examiner recorded ${recorded} result(s) for sitting ${sittingId}.`,
      changes: { sittingId, recorded },
    })

    revalidatePath('/examiner/results')
    revalidatePath('/staff/exams')
    return { success: true, recorded }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit results.'
    return { error: message }
  }
}
