'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  getHours as _getHours,
  getMinutes as _getMinutes,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as _CalendarIcon,
  Clock as _Clock,
  Filter,
  Plus,
  BookOpen,
  GraduationCap as _GraduationCap,
  CalendarDays as _CalendarDays,
} from 'lucide-react'
import SessionDetails from './SessionDetails'
import { cn } from '@/lib/utils'

type ViewMode = 'Day' | 'Week' | 'Month'

interface CalendarSession {
  id: string
  startDate: string | Date
  endDate: string | Date
  course: {
    category: string | null
    name: string
    code: string
  }
  locationType?: string
  room?: { name?: string } | null
  name?: string
  description?: string | null
}

interface CalendarGridProps {
  schedule: CalendarSession[]
  initialDate?: Date
}

export default function CalendarGrid({ schedule, initialDate }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date())
  const [selectedSession, setSelectedSession] = useState<CalendarSession | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('Week')

  const startOfRange = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfRange, i))

  const timeSlots = Array.from({ length: 24 }, (_, i) => i)
  const hourHeight = 96

  // Month view: calendar grid days
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start, end })
    // Pad start with days from previous month to fill the first week row
    const startDow = getDay(start)
    const padStart = startDow === 0 ? 6 : startDow - 1 // Monday = 0
    for (let i = padStart; i > 0; i--) {
      days.unshift(addDays(start, -i))
    }
    // Pad end to fill last week row (total should be multiple of 7)
    while (days.length % 7 !== 0) {
      days.push(addDays(days[days.length - 1], 1))
    }
    return days
  }, [currentDate])

  // Day view sessions
  const daySessions = useMemo(
    () => schedule.filter((cls) => isSameDay(new Date(cls.startDate), currentDate)),
    [schedule, currentDate]
  )

  const navigatePrev = () => {
    if (viewMode === 'Day') setCurrentDate(addDays(currentDate, -1))
    else if (viewMode === 'Week') setCurrentDate(addDays(currentDate, -7))
    else setCurrentDate(subMonths(currentDate, 1))
  }

  const navigateNext = () => {
    if (viewMode === 'Day') setCurrentDate(addDays(currentDate, 1))
    else if (viewMode === 'Week') setCurrentDate(addDays(currentDate, 7))
    else setCurrentDate(addMonths(currentDate, 1))
  }

  const headerLabel = useMemo(() => {
    if (viewMode === 'Day') return format(currentDate, 'EEEE, MMMM d, yyyy')
    if (viewMode === 'Week')
      return `${format(startOfRange, 'MMM d')} – ${format(addDays(startOfRange, 6), 'MMM d, yyyy')}`
    return format(currentDate, 'MMMM yyyy')
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [viewMode, currentDate, startOfRange])

  const getEventPosition = (startDate: string | Date, endDate: string | Date) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startHour = start.getHours() + start.getMinutes() / 60
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return { top: startHour * hourHeight, height: Math.max(durationHours * hourHeight, 24) }
  }

  const getEventStyles = (category: string | null) => {
    if (category === 'CORE') return 'bg-[#EBF1FF] text-[#4A72E8] border-l-4 border-[#4A72E8]'
    if (category === 'SPECIALIST') return 'bg-[#F3E8FF] text-[#9333EA] border-l-4 border-[#9333EA]'
    if (category === 'AVIONICS') return 'bg-[#FFF0E6] text-[#E0662A] border-l-4 border-[#E0662A]'
    return 'bg-[#F8FAFC] text-[#475569] border-l-4 border-[#94A3B8]'
  }

  const getEventIcon = (_category: string | null) => {
    return <BookOpen className="h-4 w-4" />
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto pr-2 pb-6">
      {/* Premium Header */}
      <div className="flex shrink-0 flex-col items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div
            className="flex cursor-pointer items-center gap-2 rounded-xl p-2 text-xl font-black text-slate-900 hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
            onClick={() => setCurrentDate(new Date())}
          >
            {headerLabel}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {schedule.length} Sessions
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            <Filter className="h-4 w-4" />
            Filter
          </button>

          <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {(['Day', 'Week', 'Month'] as ViewMode[]).map((view, i) => (
              <button
                key={view}
                onClick={() => setViewMode(view)}
                className={cn(
                  'px-5 py-2.5 text-sm font-bold transition-colors',
                  i === 0 && 'rounded-l-full',
                  i === 2 && 'rounded-r-full border-l border-slate-200 dark:border-slate-700',
                  i === 1 && 'border-l border-slate-200 dark:border-slate-700',
                  viewMode === view
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                {view}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 rounded-full bg-[#FF4F33] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#FF4F33]/20 transition-colors hover:bg-[#E6462D]">
            New Session <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === 'Week' && (
        <div className="flex min-h-0 shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Week Header */}
          <div className="grid shrink-0 grid-cols-[80px_1fr] border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-center gap-2 border-r border-slate-100 p-2 dark:border-slate-800">
              <button
                aria-label="Previous week"
                onClick={navigatePrev}
                className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4 text-slate-400" />
              </button>
              <button
                aria-label="Next week"
                onClick={navigateNext}
                className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-7">
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date())
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'border-r border-slate-100 p-4 text-center last:border-r-0 dark:border-slate-800',
                      isToday && 'relative bg-[#F8FBFF] dark:bg-blue-900/10'
                    )}
                  >
                    {isToday && (
                      <div className="absolute top-0 left-0 h-1 w-full bg-[#4A72E8]"></div>
                    )}
                    <span
                      className={cn(
                        'text-sm font-bold',
                        isToday ? 'text-[#4A72E8]' : 'text-slate-900 dark:text-white'
                      )}
                    >
                      {format(day, 'EEE, dd')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Week Grid */}
          <div className="flex h-150 overflow-y-auto">
            <div className="relative grid w-full grid-cols-[80px_1fr]">
              {/* Times */}
              <div className="border-r border-slate-100 dark:border-slate-800">
                {timeSlots.map((hour) => (
                  <div key={hour} className="relative h-24">
                    <span className="absolute -top-3 left-0 w-full text-center text-xs font-medium text-slate-400">
                      {hour === 0
                        ? '12 am'
                        : hour < 12
                          ? `${hour} am`
                          : hour === 12
                            ? '12 pm'
                            : `${hour - 12} pm`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid Lines & Events */}
              <div className="relative grid grid-cols-7">
                {/* Horizontal Lines */}
                <div className="pointer-events-none absolute inset-0 flex flex-col">
                  {timeSlots.map((hour) => (
                    <div
                      key={hour}
                      className="h-24 border-b border-slate-100 dark:border-slate-800"
                    ></div>
                  ))}
                </div>
                {/* Vertical Lines */}
                {weekDays.map((day, i) => (
                  <div
                    key={i}
                    className="h-[2400px] border-r border-slate-100 last:border-r-0 dark:border-slate-800"
                  ></div>
                ))}

                {/* Events */}
                {schedule.map((cls) => {
                  const dayIndex = weekDays.findIndex((d) => isSameDay(d, new Date(cls.startDate)))
                  if (dayIndex === -1) return null
                  const { top, height } = getEventPosition(cls.startDate, cls.endDate)
                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedSession(cls)}
                      className="absolute right-1 left-1 cursor-pointer transition-transform hover:z-10 hover:scale-[1.01]"
                      style={{
                        top: `${top}px`,
                        height: `${height - 4}px`,
                        gridColumnStart: dayIndex + 1,
                        gridColumnEnd: dayIndex + 2,
                      }}
                    >
                      <div
                        className={cn(
                          'relative flex h-full w-full flex-col overflow-hidden rounded-xl p-3 shadow-sm',
                          getEventStyles(cls.course.category)
                        )}
                      >
                        <div className="mb-1 w-fit rounded-lg bg-white/30 p-1.5 text-current backdrop-blur-sm">
                          {getEventIcon(cls.course.category)}
                        </div>
                        <span className="mt-1 truncate text-xs leading-tight font-bold">
                          {cls.course.name}
                        </span>
                        <span className="truncate text-[10px] font-medium opacity-80">
                          {format(new Date(cls.startDate), 'hh:mm a')} -{' '}
                          {format(new Date(cls.endDate), 'hh:mm a')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'Day' && (
        <div className="flex min-h-0 shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Day Header */}
          <div className="grid shrink-0 grid-cols-[80px_1fr] border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-center gap-2 border-r border-slate-100 p-2 dark:border-slate-800">
              <button
                aria-label="Previous week"
                onClick={navigatePrev}
                className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4 text-slate-400" />
              </button>
              <button
                aria-label="Next week"
                onClick={navigateNext}
                className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div
              className={cn(
                'relative p-4 text-center',
                isSameDay(currentDate, new Date()) && 'bg-[#F8FBFF] dark:bg-blue-900/10'
              )}
            >
              {isSameDay(currentDate, new Date()) && (
                <div className="absolute top-0 left-0 h-1 w-full bg-[#4A72E8]"></div>
              )}
              <span
                className={cn(
                  'text-sm font-bold',
                  isSameDay(currentDate, new Date())
                    ? 'text-[#4A72E8]'
                    : 'text-slate-900 dark:text-white'
                )}
              >
                {format(currentDate, 'EEEE, dd MMMM')}
              </span>
            </div>
          </div>

          {/* Day Grid */}
          <div className="flex h-150 overflow-y-auto">
            <div className="relative grid w-full grid-cols-[80px_1fr]">
              {/* Times */}
              <div className="border-r border-slate-100 dark:border-slate-800">
                {timeSlots.map((hour) => (
                  <div key={hour} className="relative h-24">
                    <span className="absolute -top-3 left-0 w-full text-center text-xs font-medium text-slate-400">
                      {hour === 0
                        ? '12 am'
                        : hour < 12
                          ? `${hour} am`
                          : hour === 12
                            ? '12 pm'
                            : `${hour - 12} pm`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid Lines & Events */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 flex flex-col">
                  {timeSlots.map((hour) => (
                    <div
                      key={hour}
                      className="h-24 border-b border-slate-100 dark:border-slate-800"
                    ></div>
                  ))}
                </div>

                {daySessions.map((cls) => {
                  const { top, height } = getEventPosition(cls.startDate, cls.endDate)
                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedSession(cls)}
                      className="absolute right-4 left-4 cursor-pointer transition-transform hover:z-10 hover:scale-[1.01]"
                      style={{
                        top: `${top}px`,
                        height: `${height - 4}px`,
                      }}
                    >
                      <div
                        className={cn(
                          'relative flex h-full w-full flex-col overflow-hidden rounded-xl p-4 shadow-sm',
                          getEventStyles(cls.course.category)
                        )}
                      >
                        <div className="mb-2 w-fit rounded-lg bg-white/30 p-2 text-current backdrop-blur-sm">
                          {getEventIcon(cls.course.category)}
                        </div>
                        <span className="mt-1 truncate text-sm leading-tight font-bold">
                          {cls.course.name}
                        </span>
                        <span className="truncate text-xs font-medium opacity-80">
                          {format(new Date(cls.startDate), 'hh:mm a')} -{' '}
                          {format(new Date(cls.endDate), 'hh:mm a')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'Month' && (
        <div className="flex shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-[#F8FBFF] dark:border-slate-800 dark:bg-blue-900/10">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="border-r border-slate-100 p-4 text-center text-sm font-bold text-slate-700 last:border-r-0 dark:border-slate-800 dark:text-slate-300"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              const dayEvents = schedule.filter((cls) => isSameDay(new Date(cls.startDate), day))

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDate(day)
                    setViewMode('Day')
                  }}
                  className={cn(
                    'relative min-h-30 cursor-pointer border-r border-b border-slate-100 p-2 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50',
                    !isCurrentMonth && 'bg-slate-50/50 dark:bg-slate-900/50',
                    isToday && 'bg-[#F8FBFF] dark:bg-blue-900/10'
                  )}
                >
                  {isToday && <div className="absolute top-0 left-0 h-1 w-full bg-[#4A72E8]"></div>}
                  <span
                    className={cn(
                      'mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                      isToday
                        ? 'bg-[#4A72E8] text-white'
                        : !isCurrentMonth
                          ? 'text-slate-400'
                          : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-1.5">
                    {dayEvents.slice(0, 3).map((cls) => (
                      <div
                        key={cls.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSession(cls)
                        }}
                        className={cn(
                          'truncate rounded-md px-2 py-1 text-xs font-bold',
                          getEventStyles(cls.course.category)
                        )}
                      >
                        {cls.course.code}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="pl-1 text-xs font-bold text-slate-400">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <SessionDetails
        session={selectedSession}
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  )
}
