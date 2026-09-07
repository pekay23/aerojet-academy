import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Users, GraduationCap, BookOpen, Sparkles, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Prisma } from '@prisma/client'

import ClassmatesFilters from './_components/ClassmatesFilters'

export const metadata: Metadata = {
  title: 'Classmates | Student Portal',
  description: 'Connect with your fellow batch-mates and classmates.',
}

type FilterType = 'batch' | 'classmates' | 'year' | 'semester' | 'pathway' | 'class'

export default async function ClassmatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    filter?: FilterType
    year?: string
    semester?: string
    pathway?: string
    classId?: string
  }>
}) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')

  const {
    q = '',
    filter = 'batch',
    year: yearParam,
    semester: semesterParam,
    pathway: pathwayParam,
    classId: classIdParam,
  } = await searchParams

  // Get current student's profile
  const studentProfile = await prismaUnfiltered.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      academicYear: true,
      semester: true,
      pathwayRel: true,
    },
  })

  if (!studentProfile || !studentProfile.academicYearId) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
          <Users className="h-12 w-12 text-slate-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Batch Not Assigned</h2>
          <p className="text-slate-500 dark:text-slate-400">
            You haven't been assigned to an academic batch yet.
          </p>
        </div>
      </div>
    )
  }

  const batchName = studentProfile.academicYear?.name || 'Current Batch'

  // Fetch filter options for the student
  const [allPathways, myClassesRaw, academicYears, semesters] = await Promise.all([
    prismaUnfiltered.studyPathwayModel.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
    prismaUnfiltered.attendanceRecord.findMany({
      where: { userId: session.user.id },
      distinct: ['classId'],
      select: {
        classId: true,
        class: {
          select: { id: true, name: true, course: { select: { code: true } } },
        },
      },
    }),
    prismaUnfiltered.academicYear.findMany({
      select: { id: true, name: true },
      orderBy: { startDate: 'desc' },
    }),
    prismaUnfiltered.semester.findMany({
      where: { academicYearId: studentProfile.academicYearId },
      select: { id: true, name: true },
      orderBy: { startDate: 'asc' },
    }),
  ])

  const myClasses = myClassesRaw.map((c) => ({
    id: c.class.id,
    label: `${c.class.course.code} — ${c.class.name}`,
  }))

  // Build the where clause based on the active filter
  let userIdFilter: string[] | undefined = undefined

  if (filter === 'classmates' || filter === 'class') {
    // Class-based filtering
    const targetClassIds = classIdParam
      ? [classIdParam]
      : myClassesRaw.map((c) => c.classId)

    if (targetClassIds.length > 0) {
      const peersInClasses = await prismaUnfiltered.attendanceRecord.findMany({
        where: {
          classId: { in: targetClassIds },
          userId: { not: session.user.id },
        },
        distinct: ['userId'],
        select: { userId: true },
      })
      userIdFilter = peersInClasses.map((p) => p.userId)
    } else {
      userIdFilter = []
    }
  }

  // Build peer query conditions
  const peerWhere: Prisma.StudentProfileWhereInput = {
    userId: userIdFilter !== undefined ? { in: userIdFilter } : { not: session.user.id },
    user: q
      ? {
          OR: [
            { profile: { firstName: { contains: q, mode: 'insensitive' } } },
            { profile: { lastName: { contains: q, mode: 'insensitive' } } },
            { academyEmail: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
  }

  // Apply filter-specific conditions
  if (filter === 'batch' || filter === 'classmates' || filter === 'class') {
    peerWhere.academicYearId = studentProfile.academicYearId
  }

  if (filter === 'year' && yearParam) {
    peerWhere.academicYearId = yearParam
  }

  if (filter === 'semester' && semesterParam) {
    peerWhere.semesterId = semesterParam
  }

  if (filter === 'pathway' && pathwayParam) {
    peerWhere.pathwayId = pathwayParam
  }

  const peers = await prismaUnfiltered.studentProfile.findMany({
    where: peerWhere,
    include: {
      user: {
        include: {
          profile: true,
          studentProfile: {
            include: {
              pathwayRel: true,
              academicYear: true,
              semester: true,
            },
          },
        },
      },
    },
    orderBy: {
      user: {
        profile: {
          firstName: 'asc',
        },
      },
    },
    take: 100,
  })

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight text-blue-800 sm:text-4xl dark:text-white">
            Classmate Directory
          </h1>
          <p className="flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-5 w-5 text-sky-400" />
            Connect with your peers from{' '}
            <span className="font-bold text-blue-800 dark:text-sky-400">
              {batchName}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Filters */}
      <ClassmatesFilters
        currentFilter={filter}
        currentQuery={q}
        currentYear={yearParam}
        currentSemester={semesterParam}
        currentPathway={pathwayParam}
        currentClassId={classIdParam}
        academicYears={academicYears}
        semesters={semesters}
        pathways={allPathways.map((p) => ({ id: p.id, name: p.name }))}
        classes={myClasses}
      />

      {/* Results count */}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        {peers.length} {peers.length === 1 ? 'student' : 'students'} found
      </p>

      {/* Grid of Classmates */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {peers.length === 0 ? (
          <div className="col-span-full flex h-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-400">
              No peers found matching your filters.
            </p>
          </div>
        ) : (
          peers.map((peer) => {
            const name = [
              peer.user.profile?.firstName,
              peer.user.profile?.lastName,
            ]
              .filter(Boolean)
              .join(' ')
            const initials = [
              peer.user.profile?.firstName?.[0],
              peer.user.profile?.lastName?.[0],
            ]
              .filter(Boolean)
              .join('')
            const pathway =
              peer.user.studentProfile?.pathwayRel?.name || 'Full-Time'
            const yearNum = peer.currentYearNumber
            const semesterName =
              peer.user.studentProfile?.semester?.name || null

            return (
              <div
                key={peer.id}
                className="group relative flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative mb-4">
                  <div className="absolute -inset-1 rounded-full bg-linear-to-tr from-blue-800 to-sky-400 opacity-0 blur transition-opacity group-hover:opacity-20" />
                  <Avatar className="h-20 w-20 border-4 border-white shadow-md dark:border-slate-800">
                    <AvatarImage
                      src={peer.user.profile?.profilePhotoUrl || undefined}
                    />
                    <AvatarFallback className="bg-slate-100 text-lg font-black text-blue-800 dark:bg-slate-800 dark:text-slate-400">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <h3 className="text-lg font-black text-blue-800 dark:text-white line-clamp-1">
                  {name}
                </h3>
                <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {peer.user.academyEmail || peer.user.email}
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 text-[10px] font-black text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 uppercase"
                  >
                    <GraduationCap className="mr-1 h-3 w-3" />
                    {pathway}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-50 text-[10px] font-black text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 uppercase"
                  >
                    <BookOpen className="mr-1 h-3 w-3" />
                    Year {yearNum}
                  </Badge>
                  {semesterName && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-50 text-[10px] font-black text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 uppercase"
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      {semesterName}
                    </Badge>
                  )}
                </div>

                <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="rounded-full bg-slate-50 p-2 dark:bg-slate-800">
                    <Users className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
