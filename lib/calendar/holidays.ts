import { prismaUnfiltered as prisma } from '@/lib/prisma/client'

/**
 * Returns all holiday dates (as midnight-normalized Date objects) within a date range.
 * Sources holidays from AdminCalendarEvent records with isHoliday=true.
 * Handles multi-day holidays (startDate to endDate) by expanding them into individual dates.
 */
export async function getHolidayDates(rangeStart: Date, rangeEnd: Date): Promise<Set<string>> {
  const holidays = await prisma.adminCalendarEvent.findMany({
    where: {
      isHoliday: true,
      deletedAt: null,
      startDate: { lte: rangeEnd },
      OR: [
        { endDate: { gte: rangeStart } },
        { endDate: null, startDate: { gte: rangeStart } },
      ],
    },
    select: { startDate: true, endDate: true },
  })

  const holidaySet = new Set<string>()

  for (const h of holidays) {
    const start = new Date(h.startDate)
    start.setHours(0, 0, 0, 0)
    const end = h.endDate ? new Date(h.endDate) : new Date(start)
    end.setHours(0, 0, 0, 0)

    const current = new Date(start)
    while (current <= end) {
      // Only include dates within our requested range
      if (current >= rangeStart && current <= rangeEnd) {
        holidaySet.add(current.toISOString().split('T')[0])
      }
      current.setDate(current.getDate() + 1)
    }
  }

  return holidaySet
}

/**
 * Checks if a specific date falls on a holiday.
 */
export function isHolidayDate(date: Date, holidayDates: Set<string>): boolean {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return holidayDates.has(normalized.toISOString().split('T')[0])
}
