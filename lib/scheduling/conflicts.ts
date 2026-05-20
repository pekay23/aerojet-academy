import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { expandMany, type Occurrence, type RecurringClassLike, type RecurrenceType } from './recurrence'

export interface Conflict {
  kind: 'INSTRUCTOR' | 'CLASSROOM'
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
  return conflicts
}
