/**
 * Expand a Class with optional `recurrenceType`/`recurrenceDays`/`recurrenceUntil`
 * into individual time-bounded occurrences within a date window.
 *
 * Today the `Class.schedule` JSON field is treated as opaque metadata
 * (frontend uses it for display only) — for conflict detection we anchor on
 * `startDate`/`endDate` of the Class and, when recurrence is set, generate
 * per-day windows within the recurrence span.
 *
 * Class.recurrenceDays is a comma-separated string of day-name prefixes
 * (e.g. "MON,WED,FRI") matching how the rest of the codebase encodes it.
 */
import { ACADEMIC_RULES } from '@/lib/constants/business-rules'

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'

export interface RecurringClassLike {
  id: string
  name: string
  instructorId: string | null
  classroomId: string | null
  startDate: Date
  endDate: Date
  recurrenceType?: RecurrenceType | null
  recurrenceDays?: string | null
  recurrenceUntil?: Date | null
}

export interface Occurrence {
  classId: string
  className: string
  instructorId: string | null
  classroomId: string | null
  start: Date
  end: Date
}

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function parseDays(s: string | null | undefined): Set<string> {
  if (!s) return new Set()
  return new Set(s.split(/[,;]/).map((x) => x.trim().slice(0, 3).toUpperCase()))
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Returns the time-of-day component as a (hours, minutes) tuple. */
function timeOfDay(d: Date): { h: number; m: number } {
  return { h: d.getHours(), m: d.getMinutes() }
}

/**
 * Expand `cls` to its occurrences whose start falls within
 * `[windowStart, windowEnd]`. Non-recurring classes return a single
 * occurrence equal to their startDate/endDate, intersected with the window.
 */
export function expandClass(
  cls: RecurringClassLike,
  windowStart: Date,
  windowEnd: Date
): Occurrence[] {
  const out: Occurrence[] = []
  const rangeEnd =
    cls.recurrenceUntil && cls.recurrenceUntil < windowEnd ? cls.recurrenceUntil : windowEnd
  const span = Math.max(0, cls.endDate.getTime() - cls.startDate.getTime())
  const startTime = timeOfDay(cls.startDate)

  // Non-recurring: emit the literal start/end if it overlaps the window.
  if (!cls.recurrenceType || cls.recurrenceType === 'NONE') {
    if (cls.endDate >= windowStart && cls.startDate <= windowEnd) {
      out.push({
        classId: cls.id,
        className: cls.name,
        instructorId: cls.instructorId,
        classroomId: cls.classroomId,
        start: cls.startDate,
        end: cls.endDate,
      })
    }
    return out
  }

  const allowedDays = parseDays(cls.recurrenceDays ?? '')
  const stepDays =
    cls.recurrenceType === 'DAILY'
      ? 1
      : cls.recurrenceType === 'WEEKLY'
        ? 7
        : cls.recurrenceType === 'BIWEEKLY'
          ? 14
          : cls.recurrenceType === 'MONTHLY'
            ? 30
            : 1

  // Iterate day-by-day from the later of (cls.startDate, windowStart)
  let cursor = startOfDay(cls.startDate > windowStart ? cls.startDate : windowStart)
  const stop = startOfDay(rangeEnd)

  // Cap at 365 iterations to avoid runaway loops on bad data.
  let safety = 0
  while (cursor <= stop && safety++ < 365) {
    const dayName = DAY_ABBR[cursor.getDay()]
    const dayAllowed = allowedDays.size === 0 || allowedDays.has(dayName)
    if (dayAllowed) {
      const occStart = new Date(cursor)
      occStart.setHours(startTime.h, startTime.m, 0, 0)
      const occEnd = new Date(occStart.getTime() + span)
      out.push({
        classId: cls.id,
        className: cls.name,
        instructorId: cls.instructorId,
        classroomId: cls.classroomId,
        start: occStart,
        end: occEnd,
      })
    }
    // Advance: for WEEKLY/BIWEEKLY with day-of-week filter, step daily but
    // rely on dayAllowed to skip; for DAILY/MONTHLY use stepDays.
    cursor = new Date(
      cursor.getTime() + (cls.recurrenceType === 'MONTHLY' ? stepDays : 1) * 86400000
    )
  }
  return out
}

/** Expand many classes; flat-map convenience. */
export function expandMany(
  classes: RecurringClassLike[],
  windowStart: Date,
  windowEnd: Date
): Occurrence[] {
  const all = classes.flatMap((c) => expandClass(c, windowStart, windowEnd))

  const MAX_DAILY_MS = ACADEMIC_RULES.MAX_DAILY_INSTRUCTIONAL_HOURS * 60 * 60 * 1000
  const dayHours = new Map<string, number>()

  return all.filter((occ) => {
    if (!occ.instructorId) return true
    const dayKey = `${occ.instructorId}|${occ.start.getFullYear()}-${occ.start.getMonth()}-${occ.start.getDate()}`
    const current = dayHours.get(dayKey) || 0
    const duration = occ.end.getTime() - occ.start.getTime()
    if (current + duration > MAX_DAILY_MS) return false
    dayHours.set(dayKey, current + duration)
    return true
  })
}
