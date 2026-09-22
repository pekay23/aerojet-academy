import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getCachedLicenseCategories } from '@/lib/cached-queries'
import { serializePrisma } from '@/lib/utils/serialization'
import SchedulingClient from './_components/SchedulingClient'

export const metadata: Metadata = {
  title: 'Academic Scheduling | Staff Portal',
}

const PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
const MAX_TERMS_PER_PATHWAY = 60
const MAX_PROGRAMME_YEARS = 10
const MAX_COURSE_ASSIGNMENTS_PER_TERM = 500

function parsePositiveInt(value: string | null, fallback: number): number {
  if (value == null) return fallback
  const n = parseInt(value, 10)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return n
}

export default async function SchedulingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireStaff()

  const sp = await searchParams
  const page = Math.max(1, parsePositiveInt(typeof sp.page === 'string' ? sp.page : null, 1))
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parsePositiveInt(typeof sp.perPage === 'string' ? sp.perPage : null, PAGE_SIZE))
  )
  const search = typeof sp.search === 'string' ? sp.search.trim() : ''
  const skip = (page - 1) * pageSize

  // Server-side course search + pagination (bounded take/skip + count)
  const courseWhere = search
    ? {
        isActive: true,
        OR: [
          { code: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : { isActive: true }

  const [pathways, programmesRaw, licenseCategories, coursesRaw, totalCourses] = await Promise.all([
    prismaUnfiltered.studyPathwayModel.findMany({
      take: 20,
      where: {
        code: { in: ['FULL_TIME_4Y', 'FULL_TIME_2Y', 'MILITARY_1Y'] },
      },
      include: {
        academicTerms: {
          take: MAX_TERMS_PER_PATHWAY,
          include: {
            courseAssignments: {
              select: { id: true, termId: true, courseId: true },
              take: MAX_COURSE_ASSIGNMENTS_PER_TERM,
            },
            licenseCategory: {
              select: { id: true, code: true, name: true },
            },
          },
          orderBy: [{ yearNumber: 'asc' }, { semesterNumber: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    }),
    prismaUnfiltered.fullTimeProgramme.findMany({
      where: {
        isActive: true,
        code: { in: ['FT_4Y_B1B2', 'FT_2Y_B1', 'MIL_1Y_B1'] },
      },
      include: {
        programmeYears: {
          take: MAX_PROGRAMME_YEARS,
          select: {
            id: true,
            programmeId: true,
            yearNumber: true,
            yearFeeAmount: true,
            seatConfirmationFee: true,
            firstPaymentAmount: true,
            semesters: true,
            isActive: true,
          },
          orderBy: { yearNumber: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }),
    getCachedLicenseCategories(),
    prismaUnfiltered.course.findMany({
      where: courseWhere,
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        moduleType: true,
        duration: true,
        price: true,
        currency: true,
        isActive: true,
        requiresPrerequisite: true,
        prerequisites: true,
        syllabusUrl: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
      },
      take: pageSize,
      skip,
      orderBy: { code: 'asc' },
    }),
    prismaUnfiltered.course.count({ where: courseWhere }),
  ])

  const programmes = programmesRaw.map((p) => ({
    ...p,
    totalFee: p.totalFee ? Number(p.totalFee) : null,
    programmeYears: p.programmeYears.map((py) => ({
      ...py,
      yearFeeAmount: py.yearFeeAmount ? Number(py.yearFeeAmount) : null,
      seatConfirmationFee: py.seatConfirmationFee ? Number(py.seatConfirmationFee) : null,
      firstPaymentAmount: py.firstPaymentAmount ? Number(py.firstPaymentAmount) : null,
    })),
  }))

  const pathwaysForClient = pathways.map((pathway) => ({
    ...pathway,
    academicTerms: pathway.academicTerms.map((term) => ({
      ...term,
      name: `Year ${term.yearNumber} Semester ${term.semesterNumber}`,
    })),
  }))

  const courses = coursesRaw.map((course) => ({
    ...course,
    price: Number(course.price),
    duration: course.duration ?? 0,
  }))

  const serializedData = serializePrisma({
    pathways: pathwaysForClient,
    programmes,
    licenseCategories,
    courses,
  })

  return (
    <div className="px-4 py-8 md:px-8">
      <SchedulingClient
        pathways={serializedData.pathways}
        programmes={serializedData.programmes}
        licenseCategories={serializedData.licenseCategories}
        courses={serializedData.courses}
        pagination={{
          page,
          pageSize,
          total: totalCourses,
          search,
        }}
      />
    </div>
  )
}
