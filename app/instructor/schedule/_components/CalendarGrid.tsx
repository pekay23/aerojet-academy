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
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
} from 'lucide-react'
import SessionDetails from './SessionDetails'
import { cn } from '@/lib/utils'

type ViewMode = 'Day' | 'Week' | 'Month'

interface CalendarGridProps {
  schedule: any[]
  initialDate?: Date
}

export default function CalendarGrid({ schedule, initialDate }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date())
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('Week')

  const startOfRange = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfRange, i))

  const timeSlots = Array.from({ length: 10 }, (_, i) => 8 + i)
  const hourHeight = 96

  const getEventPosition = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startHour = start.getHours() + start.getMinutes() / 60
    const offsetHours = startHour - 8
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return { top: offsetHours * hourHeight, height: durationHours * hourHeight }
  }

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      CORE: 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20',
      SPECIALIST: 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20',
      AVIONICS: 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20',
    }
    return colors[category || ''] || 'border-slate-400 bg-slate-50/50 dark:bg-slate-800/20'
  }

  const getCategoryDotColor = (category: string | null) => {
    const colors: Record<string, string> = {
      CORE: 'bg-blue-500',
      SPECIALIST: 'bg-purple-500',
      AVIONICS: 'bg-orange-500',
    }
    return colors[category || ''] || 'bg-slate-400'
  }

  // Navigation handlers
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
  }, [viewMode, currentDate, startOfRange])

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

  const renderEventCard = (cls: any, height: number) => (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-600 uppercase shadow-sm dark:bg-slate-800 dark:text-slate-300">
            {cls.course.code}
          </span>
        </div>
        <h4 className="text-[11px] leading-tight font-black text-slate-800 dark:text-slate-100">
          {cls.course.name}
        </h4>
        <div className="mt-2 flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3" />
          <span className="text-[10px] font-medium tracking-tight">
            {format(new Date(cls.startDate), 'HH:mm')} – {format(new Date(cls.endDate), 'HH:mm')}
          </span>
        </div>
      </div>
      {height > 150 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 mt-auto hidden duration-300 group-hover:block">
          <button className="w-full rounded-lg bg-blue-600 py-1.5 text-[9px] font-black tracking-widest text-white uppercase shadow-sm transition-all hover:bg-blue-700">
            Open Session
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/30 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-xl border border-slate-100 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={navigatePrev}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-3">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-bold tracking-tight text-slate-700 uppercase dark:text-slate-200">
                {headerLabel}
              </span>
            </div>
            <button
              onClick={navigateNext}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-500 uppercase transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Today
          </button>
        </div>

        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
          {(['Day', 'Week', 'Month'] as ViewMode[]).map((view) => (
            <button
              key={view}
              onClick={() => setViewMode(view)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all',
                viewMode === view
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* ─── WEEK VIEW ─── */}
      {viewMode === 'Week' && (
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/10">
            <div className="border-r border-slate-100 p-4 dark:border-slate-800" />
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date())
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'border-r border-slate-100 p-4 text-center last:border-r-0 dark:border-slate-800',
                    isToday && 'relative bg-blue-50/30 dark:bg-blue-900/10'
                  )}
                >
                  {isToday && <div className="absolute top-0 left-0 h-1 w-full bg-blue-500" />}
                  <span className={cn('mb-1 block text-[10px] font-black tracking-widest uppercase', isToday ? 'text-blue-500' : 'text-slate-400')}>
                    {format(day, 'EEE')}
                  </span>
                  <span className={cn('block text-xl font-black tracking-tight', isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200')}>
                    {format(day, 'd')}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="relative flex-1 overflow-y-auto scroll-smooth bg-slate-50/20 dark:bg-slate-900/20">
            <div className="grid min-h-full grid-cols-8">
              <div className="col-span-1 border-r border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30">
                {timeSlots.map((hour) => (
                  <div key={hour} className="flex h-24 items-center justify-center border-b border-slate-100/50 text-[10px] font-black text-slate-400 dark:border-slate-800/50">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              <div className="relative col-span-7 grid grid-cols-7">
                <div className="pointer-events-none absolute inset-0 flex flex-col">
                  {timeSlots.map((hour) => (
                    <div key={hour} className="h-24 w-full border-b border-dashed border-slate-200/60 dark:border-slate-800/60" />
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-0 flex">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-full w-1/7 border-r border-slate-100 last:border-r-0 dark:border-slate-800" />
                  ))}
                </div>

                {schedule.map((cls) => {
                  const dayIndex = weekDays.findIndex((d) => isSameDay(d, new Date(cls.startDate)))
                  if (dayIndex === -1) return null
                  const { top, height } = getEventPosition(cls.startDate, cls.endDate)
                  return (
                    <div
                      key={cls.id}
                      className="group relative cursor-pointer"
                      style={{ gridColumnStart: dayIndex + 1, gridColumnEnd: dayIndex + 2 }}
                      onClick={() => setSelectedSession(cls)}
                    >
                      <div
                        className={cn('absolute right-1 left-1 z-10 overflow-hidden rounded-xl border-l-4 p-3 shadow-sm transition-all duration-300 hover:shadow-md', getCategoryColor(cls.course.category))}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        {renderEventCard(cls, height)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DAY VIEW ─── */}
      {viewMode === 'Day' && (
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/10">
            <div className="border-r border-slate-100 p-4 dark:border-slate-800" />
            <div className={cn('p-4 text-center', isSameDay(currentDate, new Date()) && 'relative bg-blue-50/30 dark:bg-blue-900/10')}>
              {isSameDay(currentDate, new Date()) && <div className="absolute top-0 left-0 h-1 w-full bg-blue-500" />}
              <span className={cn('mb-1 block text-[10px] font-black tracking-widest uppercase', isSameDay(currentDate, new Date()) ? 'text-blue-500' : 'text-slate-400')}>
                {format(currentDate, 'EEEE')}
              </span>
              <span className={cn('block text-xl font-black tracking-tight', isSameDay(currentDate, new Date()) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200')}>
                {format(currentDate, 'MMMM d')}
              </span>
            </div>
          </div>

          <div className="relative flex-1 overflow-y-auto scroll-smooth bg-slate-50/20 dark:bg-slate-900/20">
            <div className="grid min-h-full grid-cols-2">
              <div className="col-span-1 border-r border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30">
                {timeSlots.map((hour) => (
                  <div key={hour} className="flex h-24 items-center justify-center border-b border-slate-100/50 text-[10px] font-black text-slate-400 dark:border-slate-800/50">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              <div className="relative col-span-1">
                <div className="pointer-events-none absolute inset-0 flex flex-col">
                  {timeSlots.map((hour) => (
                    <div key={hour} className="h-24 w-full border-b border-dashed border-slate-200/60 dark:border-slate-800/60" />
                  ))}
                </div>

                {daySessions.map((cls) => {
                  const { top, height } = getEventPosition(cls.startDate, cls.endDate)
                  return (
                    <div
                      key={cls.id}
                      className="group absolute right-2 left-2 z-10 cursor-pointer"
                      onClick={() => setSelectedSession(cls)}
                    >
                      <div
                        className={cn('overflow-hidden rounded-xl border-l-4 p-4 shadow-sm transition-all duration-300 hover:shadow-md', getCategoryColor(cls.course.category))}
                        style={{ top: `${top}px`, height: `${height}px`, position: 'absolute', left: 0, right: 0 }}
                      >
                        {renderEventCard(cls, height)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MONTH VIEW ─── */}
      {viewMode === 'Month' && (
        <div className="flex-1 overflow-y-auto">
          {/* Day names header */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/10">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="border-r border-slate-100 p-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase last:border-r-0 dark:border-slate-800">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {monthDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              const dayEvents = schedule.filter((cls) => isSameDay(new Date(cls.startDate), day))

              return (
                <div
                  key={idx}
                  className={cn(
                    'min-h-[100px] border-r border-b border-slate-100 p-2 transition-colors last:border-r-0 dark:border-slate-800',
                    !isCurrentMonth && 'bg-slate-50/50 dark:bg-slate-900/50',
                    isToday && 'bg-blue-50/30 dark:bg-blue-900/10'
                  )}
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      setCurrentDate(day)
                      setViewMode('Day')
                    }
                  }}
                >
                  <span
                    className={cn(
                      'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      isToday && 'bg-blue-500 text-white',
                      !isToday && isCurrentMonth && 'text-slate-700 dark:text-slate-200',
                      !isCurrentMonth && 'text-slate-300 dark:text-slate-600'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((cls) => (
                      <button
                        key={cls.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSession(cls)
                        }}
                        className={cn(
                          'flex w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', getCategoryDotColor(cls.course.category))} />
                        <span className="truncate text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {format(new Date(cls.startDate), 'HH:mm')} {cls.course.code}
                        </span>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="block text-[9px] font-bold text-slate-400">
                        +{dayEvents.length - 3} more
                      </span>
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
