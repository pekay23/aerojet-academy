import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAuth } from '@/lib/auth/helpers'
import {
  apiSuccess,
  apiForbidden,
  apiNotFound,
  apiError,
  withErrorHandler,
} from '@/lib/api/response'
import { takeAttendanceSchema, validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { UserRole } from '@prisma/client'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const user = await requireAuth()
    if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')

    const classItem = await prisma.class.findUnique({ where: { id: ctx?.params?.id } })
    if (!classItem) return apiNotFound('Class not found')
    if (classItem.instructorId !== user.id) return apiForbidden('Not assigned to this class')

    const records = await prisma.attendanceRecord.findMany({
      where: { classId: classItem.id },
      include: {
        user: {
          include: { profile: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { date: 'desc' },
    })

    return apiSuccess(records)
  }
)

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const user = await requireAuth()
    if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')

    const classId = ctx?.params?.id
    if (!classId) return apiError('Class ID required')

    const classItem = await prisma.class.findUnique({ where: { id: classId } })
    if (!classItem) return apiNotFound('Class not found')
    if (classItem.instructorId !== user.id) return apiForbidden('Not assigned to this class')

    const body = await req.json()
    const validation = validateBody(takeAttendanceSchema, body)
    if (!validation.success) return apiError(validation.error)

    const { records, date } = validation.data
    const attendanceDate = date ? new Date(date) : new Date()

    // Upsert attendance records
    const results = await Promise.all(
      records.map((record: { userId: string; present: boolean; lateMinutes: number; notes?: string }) => {
        const studentStatus = record.present ? 'PRESENT' : (record.lateMinutes > 0 ? 'LATE' : 'ABSENT')
        return prisma.attendanceRecord.upsert({
          where: {
            classId_userId_date: {
              classId,
              userId: record.userId,
              date: attendanceDate,
            },
          },
          update: {
            status: studentStatus,
            minutesLate: record.lateMinutes,
            notes: record.notes || null,
            recordedBy: user.id,
          },
          create: {
            classId,
            userId: record.userId,
            date: attendanceDate,
            status: studentStatus,
            minutesLate: record.lateMinutes,
            notes: record.notes || null,
            recordedBy: user.id,
          },
        })
      })
    )

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'Class',
      entityId: classId,
      userId: user.id,
      details: {
        action: 'attendance_recorded',
        date: attendanceDate.toISOString(),
        totalRecords: records.length,
        presentCount: records.filter((r: any) => r.status === 'PRESENT').length,
      },
    })

    return apiSuccess({
      message: `Attendance recorded for ${results.length} students`,
      records: results,
    })
  }
)
