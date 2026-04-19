import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, apiError, withErrorHandler } from '@/lib/api/response'
import { serializePrisma } from '@/lib/utils/serialization'

// GET /api/staff/students/[id]
// Comprehensive student detail — used by StudentDetailPanel (quick preview)
// and the full student management page at /staff/students/[id]
export const GET = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Student ID required')

    const { searchParams } = new URL(req.url)
    const full = searchParams.get('full') === '1'

    const student = await prisma.user.findUnique({
      where: { id, role: 'STUDENT' },
      include: {
        profile: true,
        studentProfile: {
          include: {
            academicYear: { select: { id: true, name: true } },
            semester: { select: { id: true, name: true } },
            pathwayRel: { select: { id: true, code: true, name: true } },
            licenseTargets: {
              include: { licenseCategory: { select: { id: true, code: true, name: true } } },
            },
          },
        },
        wallet: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: full ? 100 : 20,
            },
          },
        },
        enrollments: {
          include: {
            course: true,
            grades: { orderBy: { assessmentDate: 'desc' } },
          },
        },
        poolMemberships: {
          include: {
            pool: { include: { event: true } },
            examComponent: { include: { course: { select: { name: true, code: true } } } },
          },
        },
        attendanceRecords: {
          orderBy: { date: 'desc' },
          take: full ? 100 : 30,
          include: {
            class: { select: { name: true, course: { select: { name: true, code: true } } } },
          },
        },
        examResults: {
          include: {
            exam: {
              include: {
                examComponent: { include: { course: { select: { name: true, code: true } } } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        // Fetch ALL exam bookings, not just COMPLETED
        examBookings: {
          include: {
            exam: {
              include: {
                examComponent: { include: { course: { select: { name: true, code: true } } } },
              },
            },
            event: { select: { id: true, name: true, startDate: true, endDate: true } },
            course: { select: { id: true, name: true, code: true } },
          },
          orderBy: { examDate: 'desc' },
        },
        examBundles: {
          orderBy: { createdAt: 'desc' },
        },
        bookingEntitlements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!student) return apiNotFound('Student not found')

    // If full mode, also fetch full-time enrollment / OJT data
    let fullTimeData = null
    if (full) {
      const ftEnrollments = await prisma.fullTimeEnrollment.findMany({
        where: { studentId: id },
        include: {
          programme: { select: { code: true, name: true } },
          ojtPeriods: { orderBy: { startDate: 'desc' } },
          milestones: { orderBy: [{ yearNumber: 'asc' }, { createdAt: 'asc' }] },
        },
      })
      fullTimeData = ftEnrollments.map((e) => {
        const { programme, ojtPeriods, milestones, ...rest } = e
        return {
          ...rest,
          programme,
          ojtPeriods: ojtPeriods.map((o) => ({
            ...o,
            startDate: o.startDate.toISOString(),
            endDate: o.endDate?.toISOString() ?? null,
            createdAt: o.createdAt.toISOString(),
            updatedAt: o.updatedAt.toISOString(),
          })),
          milestones,
        }
      })
    }

    const { password, ...safe } = student

    return apiSuccess(serializePrisma({
      ...safe,
      fullTimeEnrollments: fullTimeData,
    }))
  }
)
