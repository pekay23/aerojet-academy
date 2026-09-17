import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { expandMany, type Occurrence, type RecurringClassLike, type RecurrenceType } from './recurrence'

export interface Conflict {
  kind: 'INSTRUCTOR' | 'CLASSROOM' | 'INSTRUCTOR_UNAVAILABLE'
  resourceId: string
  resourceLabel: string
  date: string // YYYY-MM-DD
  a: Occurrence
  b: Occurrence
}

function overlaps(a: Occurrence, b: Occurrence): boolean {
  return a.start < b.end && b.start < a.end
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function timeOverlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = timeToMinutes(startA)
  const aEnd = timeToMinutes(endA)
  const bStart = timeToMinutes(startB)
  const bEnd = timeToMinutes(endB)
  return aStart < bEnd && bStart < aEnd
}

/**
 * Load every class that could intersect the window and detect overlapping
 * occurrences within the same instructor or classroom.
 *
 * Excludes a class by id (`excludeClassId`) when called for a "would this
 * new/edited class create a conflict?" preview.
 */
export async function findConflicts(args: {
  from: Date
  to: Date
  excludeClassId?: string
}): Promise<Conflict[]> {
  const classes = await prismaUnfiltered.class.findMany({
    where: {
      OR: [
        { startDate: { lte: args.to }, endDate: { gte: args.from } },
        { recurrenceUntil: { gte: args.from } },
      ],
      ...(args.excludeClassId ? { id: { not: args.excludeClassId } } : {}),
    },
    select: {
      id: true,
      name: true,
      instructorId: true,
      classroomId: true,
      startDate: true,
      endDate: true,
      recurrenceType: true,
      recurrenceDays: true,
      recurrenceUntil: true,
      instructor: {
        select: {
          user: {
            select: { profile: { select: { firstName: true, lastName: true } }, email: true },
          },
        },
      },
      classroom: { select: { name: true } },
    },
  })

  const instructorLabel = new Map<string, string>()
  const classroomLabel = new Map<string, string>()
  for (const c of classes) {
    if (c.instructorId && c.instructor?.user) {
      const u = c.instructor.user
      instructorLabel.set(
        c.instructorId,
        u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email
      )
    }
    if (c.classroomId && c.classroom) classroomLabel.set(c.classroomId, c.classroom.name)
  }

  const expandable: RecurringClassLike[] = classes.map((c) => ({
    id: c.id,
    name: c.name,
    instructorId: c.instructorId,
    classroomId: c.classroomId,
    startDate: c.startDate,
    endDate: c.endDate,
    recurrenceType: c.recurrenceType as RecurrenceType,
    recurrenceDays: c.recurrenceDays,
    recurrenceUntil: c.recurrenceUntil,
  }))

  const occurrences = expandMany(expandable, args.from, args.to)

  // Load instructor availability windows for the date range
  const instructorIds = [...new Set(classes.filter(c => c.instructorId).map(c => c.instructorId!))]
  const availability = instructorIds.length > 0
    ? await prismaUnfiltered.staffAvailability.findMany({
        where: {
          userId: { in: instructorIds },
          available: false,
          OR: [
            { kind: 'SPECIFIC_DATE', date: { gte: args.from, lte: args.to } },
            { kind: 'RECURRING_WEEKLY' },
          ],
        },
        select: { userId: true, kind: true, dayOfWeek: true, date: true, startTime: true, endTime: true },
      })
    : []

  const availabilityByInstructor = new Map<string, typeof availability>()
  for (const a of availability) {
    const list = availabilityByInstructor.get(a.userId) || []
    list.push(a)
    availabilityByInstructor.set(a.userId, list)
  }

  // Bucket by (resource, date) to keep the comparison cost bounded.
  const buckets = new Map<string, Occurrence[]>()
  for (const occ of occurrences) {
    const day = isoDate(occ.start)
    if (occ.instructorId) {
      const k = `I|${occ.instructorId}|${day}`
      buckets.set(k, [...(buckets.get(k) ?? []), occ])
    }
    if (occ.classroomId) {
      const k = `R|${occ.classroomId}|${day}`
      buckets.set(k, [...(buckets.get(k) ?? []), occ])
    }
  }

  const conflicts: Conflict[] = []
  for (const [key, occs] of buckets) {
    if (occs.length < 2) continue
    const [tag, resourceId, day] = key.split('|')
    for (let i = 0; i < occs.length; i++) {
      for (let j = i + 1; j < occs.length; j++) {
        if (overlaps(occs[i], occs[j])) {
          conflicts.push({
            kind: tag === 'I' ? 'INSTRUCTOR' : 'CLASSROOM',
            resourceId,
            resourceLabel:
              tag === 'I'
                ? (instructorLabel.get(resourceId) ?? resourceId)
                : (classroomLabel.get(resourceId) ?? resourceId),
            date: day,
            a: occs[i],
            b: occs[j],
          })
        }
      }
    }
  }

  // Check instructor availability conflicts
  const dayOfWeekMap: Record<number, string> = {
    0: 'SUNDAY',
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
  }

  for (const occ of occurrences) {
    if (!occ.instructorId) continue
    const day = isoDate(occ.start)
    const occDayOfWeek = occ.start.getDay()
    const occStart = occ.start.toTimeString().slice(0, 5)
    const occEnd = occ.end.toTimeString().slice(0, 5)
    const windows = availabilityByInstructor.get(occ.instructorId) || []

    for (const win of windows) {
      if (win.kind === 'SPECIFIC_DATE') {
        if (win.date && isoDate(win.date) === day) {
          if (timeOverlaps(win.startTime, win.endTime, occStart, occEnd)) {
            conflicts.push({
              kind: 'INSTRUCTOR_UNAVAILABLE',
              resourceId: occ.instructorId,
              resourceLabel: instructorLabel.get(occ.instructorId) ?? occ.instructorId,
              date: day,
              a: occ,
              b: {
                classId: 'availability',
                className: 'Unavailable',
                instructorId: occ.instructorId,
                classroomId: occ.classroomId,
                start: occ.start,
                end: occ.end,
              },
            })
          }
        }
      } else if (win.kind === 'RECURRING_WEEKLY') {
        const winDayName = win.dayOfWeek != null ? dayOfWeekMap[win.dayOfWeek] : undefined
        if (winDayName && occDayOfWeek === win.dayOfWeek) {
          if (timeOverlaps(win.startTime, win.endTime, occStart, occEnd)) {
            conflicts.push({
              kind: 'INSTRUCTOR_UNAVAILABLE',
              resourceId: occ.instructorId,
              resourceLabel: instructorLabel.get(occ.instructorId) ?? occ.instructorId,
              date: day,
              a: occ,
              b: {
                classId: 'availability',
                className: 'Unavailable',
                instructorId: occ.instructorId,
                classroomId: occ.classroomId,
                start: occ.start,
                end: occ.end,
              },
            })
          }
        }
      }
    }
  }

  return conflicts
}
