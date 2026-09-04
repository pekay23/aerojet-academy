'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getHours,
  getMinutes,
  addHours,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  _Filter,
  BookOpen,
  GraduationCap,
  CalendarDays,
  Users,
  UserCheck,
  Globe,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  createAdminCalendarEvent,
  updateAdminCalendarEvent,
  deleteAdminCalendarEvent,
} from '../actions'

export interface StaffCalendarEvent {
  id: string
  dbId: string
  title: string
  description?: string | null
  startDate: string
  endDate?: string | null
  color: string
  source: 'class' | 'exam' | 'admin'
  editable: boolean
  visibleTo:
    | 'ALL'
    | 'STUDENTS'
    | 'INSTRUCTORS'
    | 'EXAM_ONLY'
    | 'MODULAR'
    | 'FULL_TIME'
    | 'SPECIFIC_USER'
  recurrenceType?: string | null
  recurrenceDays?: string | null
  recurrenceUntil?: string | null
  targetUserId?: string | null
}

interface Props {
  events: StaffCalendarEvent[]
  initialDate?: Date
  currentUserId: string
}

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Everyone', icon: Globe },
  { value: 'STUDENTS', label: 'Students Only', icon: UserCheck },
  { value: 'INSTRUCTORS', label: 'Instructors Only', icon: Users },
  { value: 'EXAM_ONLY', label: 'Exam Only Students', icon: BookOpen },
  { value: 'MODULAR', label: 'Modular Students', icon: BookOpen },
  { value: 'FULL_TIME', label: 'Full Time Students', icon: GraduationCap },
  { value: 'SPECIFIC_USER', label: 'Specific User', icon: UserCheck },
]

const COLOR_OPTIONS = ['#4A72E8', '#FF4F33', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4']

function getEventStyles(source: string, _color: string) {
  if (source === 'exam') return 'bg-[#FF4F33] text-white'
  if (source === 'class') return 'bg-[#EBF1FF] text-[#4A72E8]'
  return 'text-white'
}

function AudienceBadge({ visibleTo }: { visibleTo: string }) {
  if (visibleTo === 'STUDENTS')
    return (
      <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700">
        Students
      </span>
    )
  if (visibleTo === 'INSTRUCTORS')
    return (
      <span className="ml-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-bold text-purple-700">
        Instructors
      </span>
    )
  if (visibleTo === 'EXAM_ONLY')
    return (
      <span className="ml-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs font-bold text-indigo-700">
        Exam Only
      </span>
    )
  if (visibleTo === 'MODULAR')
    return (
      <span className="ml-1 rounded-full bg-cyan-100 px-1.5 py-0.5 text-xs font-bold text-cyan-700">
        Modular
      </span>
    )
  if (visibleTo === 'FULL_TIME')
    return (
      <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-700">
        Full Time
      </span>
    )
  if (visibleTo === 'SPECIFIC_USER')
    return (
      <span className="ml-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-xs font-bold text-rose-700">
        Specific User
      </span>
    )
  return (
    <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600">
      All
    </span>
  )
}

export default function StaffCalendarGrid({ events, initialDate, _currentUserId }: Props) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date())
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Week')
  const [popupEvent, setPopupEvent] = useState<StaffCalendarEvent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<StaffCalendarEvent | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formColor, setFormColor] = useState('#4A72E8')
  const [formAudience, setFormAudience] = useState<
    'ALL' | 'STUDENTS' | 'INSTRUCTORS' | 'EXAM_ONLY' | 'MODULAR' | 'FULL_TIME' | 'SPECIFIC_USER'
  >('ALL')
  const [formTargetUserId, setFormTargetUserId] = useState('')
  const [formRecurrence, setFormRecurrence] = useState('NONE')

  const today = new Date()
  const hourHeight = 80
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)
  const startOfRange = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfRange, i))

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start, end })
    const startPad = start.getDay()
    const leading = Array.from({ length: startPad }, (_, i) => addDays(start, i - startPad))
    const total = [...leading, ...days]
    const trailing = Array.from({ length: 42 - total.length }, (_, i) => addDays(end, i + 1))
    return [...leading, ...days, ...trailing]
  }, [currentDate])

  const eventsByDate = useMemo(() => {
    const map: Record<string, StaffCalendarEvent[]> = {}
    events.forEach((evt) => {
      const d = format(new Date(evt.startDate), 'yyyy-MM-dd')
      if (!map[d]) map[d] = []
      if (!map[d].some((e) => e.id === evt.id)) map[d].push(evt)
    })
    return map
  }, [events])
  const currentDayEvents = useMemo(() => {
    const dayStr = format(currentDate, 'yyyy-MM-dd')
    return [...(eventsByDate[dayStr] || [])].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
  }, [currentDate, eventsByDate])

  const getPos = (evt: StaffCalendarEvent) => {
    const start = new Date(evt.startDate)
    const end = evt.endDate ? new Date(evt.endDate) : addHours(start, 1)
    const top = (getHours(start) + getMinutes(start) / 60) * hourHeight
    const height = Math.max(((end.getTime() - start.getTime()) / 3_600_000) * hourHeight, 24)
    return { top, height }
  }

  const openAdd = () => {
    setEditingEvent(null)
    setFormTitle('')
    setFormDesc('')
    setFormStart('')
    setFormEnd('')
    setFormColor('#4A72E8')
    setFormAudience('ALL')
    setFormTargetUserId('')
    setFormRecurrence('NONE')
    setShowModal(true)
  }

  const openEdit = (evt: StaffCalendarEvent) => {
    setEditingEvent(evt)
    setFormTitle(evt.title)
    setFormDesc(evt.description || '')
    setFormStart(evt.startDate.slice(0, 16))
    setFormEnd(evt.endDate?.slice(0, 16) || '')
    setFormColor(evt.color)
    setFormAudience(evt.visibleTo as 'ALL' | 'STUDENTS' | 'INSTRUCTORS' | 'EXAM_ONLY' | 'MODULAR' | 'FULL_TIME' | 'SPECIFIC_USER')
    setFormTargetUserId(evt.targetUserId || '')
    setFormRecurrence(evt.recurrenceType || 'NONE')
    setPopupEvent(null)
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formTitle.trim()) {
      toast.error('Title is required')
      return
    }
    startTransition(async () => {
      const data = {
        title: formTitle,
        description: formDesc,
        startDate: formStart,
        endDate: formEnd ? formEnd : undefined,
        color: formColor,
        visibleTo: formAudience,
        targetUserId: formAudience === 'SPECIFIC_USER' ? formTargetUserId : undefined,
        recurrenceType: formRecurrence,
      }
      const res = editingEvent
        ? await updateAdminCalendarEvent(editingEvent.dbId, data)
        : await createAdminCalendarEvent(data)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(editingEvent ? 'Event updated!' : 'Event created!')
        setShowModal(false)
      }
    })
  }

  const handleDelete = (evt: StaffCalendarEvent) => {
    startTransition(async () => {
      const res = await deleteAdminCalendarEvent(evt.dbId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Event deleted')
        setPopupEvent(null)
      }
    })
  }

  const handlePrev = () => {
    if (viewMode === 'Day') setCurrentDate(addDays(currentDate, -1))
    else if (viewMode === 'Week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subMonths(currentDate, 1))
  }
  const handleNext = () => {
    if (viewMode === 'Day') setCurrentDate(addDays(currentDate, 1))
    else if (viewMode === 'Week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addMonths(currentDate, 1))
  }
  const label =
    viewMode === 'Day'
      ? format(currentDate, 'EEEE, MMMM d, yyyy')
      : viewMode === 'Week'
        ? format(startOfRange, 'MMMM yyyy')
        : format(currentDate, 'MMMM yyyy')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Calendar
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage and broadcast institutional events across all portals
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#4A72E8]" /> Class Sessions
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#FF4F33]" /> Exam Events
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#8b5cf6]" /> Admin Events
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <button
            aria-label="Previous period"
            onClick={handlePrev}
            className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-5 w-5 text-slate-500" />
          </button>
          <span className="min-w-[160px] text-center text-xl font-black text-slate-900 dark:text-white">
            {label}
          </span>
          <button
            aria-label="Next period"
            onClick={handleNext}
            className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 dark:border-slate-700 dark:hover:text-white"
          >
            Today
          </button>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('Month')}
              className={cn(
                'rounded-l-full px-4 py-2.5 text-sm font-bold transition-colors',
                viewMode === 'Month'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              )}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('Week')}
              className={cn(
                'border-l border-slate-200 px-4 py-2.5 text-sm font-bold transition-colors dark:border-slate-700',
                viewMode === 'Week'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              )}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('Day')}
              className={cn(
                'rounded-r-full border-l border-slate-200 px-4 py-2.5 text-sm font-bold transition-colors dark:border-slate-700',
                viewMode === 'Day'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              )}
            >
              Day
            </button>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-full bg-[#FF4F33] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#FF4F33]/20 transition-colors hover:bg-[#E6462D]"
          >
            New Event <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Agenda */}
      <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
            Daily Agenda
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {currentDayEvents.length}
          </span>
        </div>
        {currentDayEvents.length === 0 ? (
          <p className="py-4 text-sm font-medium text-slate-500">
            No events scheduled for this day.
          </p>
        ) : (
          currentDayEvents.map((evt) => (
            <button
              key={evt.id}
              onClick={() => setPopupEvent(evt)}
              className="flex w-full items-start gap-3 rounded-xl border border-slate-100 p-3 text-left dark:border-slate-800"
            >
              <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: evt.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
                  {evt.title}
                </span>
                <span className="block text-xs font-medium text-slate-500">
                  {format(new Date(evt.startDate), 'hh:mm a')}
                  {evt.endDate ? ` - ${format(new Date(evt.endDate), 'hh:mm a')}` : ''}
                </span>
              </span>
            </button>
          ))
        )}
      </div>

      {/* Day View */}
      {viewMode === 'Day' && (
        <div className="flex flex-col rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-4 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-500">{format(currentDate, 'EEEE')}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {format(currentDate, 'MMMM d')}
            </h3>
          </div>
          <div className="max-h-[760px] overflow-y-auto">
            {timeSlots.map((hour) => {
              const hourEvents = currentDayEvents.filter(
                (evt) => getHours(new Date(evt.startDate)) === hour
              )
              return (
                <div
                  key={hour}
                  className="grid min-h-[84px] grid-cols-[72px_1fr] border-b border-slate-100 dark:border-slate-800"
                >
                  <div className="border-r border-slate-100 px-3 py-4 text-right text-xs font-bold text-slate-400 dark:border-slate-800">
                    {hour === 0
                      ? '12 am'
                      : hour < 12
                        ? `${hour} am`
                        : hour === 12
                          ? '12 pm'
                          : `${hour - 12} pm`}
                  </div>
                  <div className="space-y-2 p-2">
                    {hourEvents.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => setPopupEvent(evt)}
                        title={`${evt.title} - ${format(new Date(evt.startDate), 'hh:mm a')}`}
                        className={cn(
                          'w-full rounded-xl p-3 text-left text-sm font-bold shadow-sm',
                          getEventStyles(evt.source, evt.color)
                        )}
                        style={
                          evt.source === 'admin'
                            ? { backgroundColor: evt.color, color: '#fff' }
                            : undefined
                        }
                      >
                        <span className="block truncate">{evt.title}</span>
                        <span className="block text-xs font-medium opacity-80">
                          {format(new Date(evt.startDate), 'hh:mm a')}
                          {evt.endDate ? ` - ${format(new Date(evt.endDate), 'hh:mm a')}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'Week' && (
        <div className="hidden flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm md:flex dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-[80px_1fr] border-b border-slate-100 dark:border-slate-800">
            <div className="border-r border-slate-100 p-2 dark:border-slate-800" />
            <div className="grid grid-cols-7">
              {weekDays.map((day) => {
                const isToday = isSameDay(day, today)
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'relative border-r border-slate-100 p-4 text-center last:border-r-0 dark:border-slate-800',
                      isToday && 'bg-[#F8FBFF] dark:bg-blue-900/10'
                    )}
                  >
                    {isToday && <div className="absolute top-0 left-0 h-1 w-full bg-[#4A72E8]" />}
                    <span
                      className={cn(
                        'text-sm font-bold',
                        isToday ? 'text-[#4A72E8]' : 'text-slate-700 dark:text-white'
                      )}
                    >
                      {format(day, 'EEE, dd')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex h-[720px] overflow-y-auto">
            <div className="relative grid w-full grid-cols-[80px_1fr]">
              <div className="border-r border-slate-100 dark:border-slate-800">
                {timeSlots.map((h) => (
                  <div key={h} className="relative h-[80px]">
                    <span className="absolute -top-3 left-0 w-full text-center text-xs font-medium text-slate-400">
                      {h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative grid grid-cols-7">
                <div className="pointer-events-none absolute inset-0 flex flex-col">
                  {timeSlots.map((h) => (
                    <div
                      key={h}
                      className="h-[80px] border-b border-slate-100 dark:border-slate-800"
                    />
                  ))}
                </div>
                {weekDays.map((day, di) => (
                  <div
                    key={di}
                    className="h-[1920px] border-r border-slate-100 last:border-r-0 dark:border-slate-800"
                  />
                ))}
                {weekDays.map((day, di) => {
                  const dayStr = format(day, 'yyyy-MM-dd')
                  return (eventsByDate[dayStr] || []).map((evt) => {
                    const { top, height } = getPos(evt)
                    return (
                      <div
                        key={evt.id}
                        onClick={() => setPopupEvent(evt)}
                        className="absolute right-1 left-1 cursor-pointer transition-transform hover:z-10 hover:scale-[1.01]"
                        title={`${evt.title} - ${format(new Date(evt.startDate), 'hh:mm a')}`}
                        style={{
                          top: `${top}px`,
                          height: `${height - 4}px`,
                          gridColumnStart: di + 1,
                          gridColumnEnd: di + 2,
                        }}
                      >
                        <div
                          className={cn(
                            'flex h-full w-full flex-col overflow-hidden rounded-xl p-2 shadow-sm',
                            getEventStyles(evt.source, evt.color)
                          )}
                          style={
                            evt.source === 'admin' ? { backgroundColor: evt.color } : undefined
                          }
                        >
                          <span className="truncate text-xs leading-tight font-bold">
                            {evt.title}
                          </span>
                          <span className="truncate text-xs opacity-80">
                            {format(new Date(evt.startDate), 'hh:mm a')}
                          </span>
                          <AudienceBadge visibleTo={evt.visibleTo} />
                        </div>
                      </div>
                    )
                  })
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'Month' && (
        <div className="hidden flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm md:flex dark:border-slate-800 dark:bg-slate-900">
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
              const dayStr = format(day, 'yyyy-MM-dd')
              const dayEvts = eventsByDate[dayStr] || []
              const isToday = isSameDay(day, today)
              const isCur = day.getMonth() === currentDate.getMonth()
              return (
                <div
                  key={idx}
                  className={cn(
                    'relative min-h-[110px] border-r border-b border-slate-100 p-2 dark:border-slate-800',
                    !isCur && 'bg-slate-50/50 dark:bg-slate-900/50',
                    isToday && 'bg-[#F8FBFF] dark:bg-blue-900/10'
                  )}
                >
                  {isToday && <div className="absolute top-0 left-0 h-1 w-full bg-[#4A72E8]" />}
                  <span
                    className={cn(
                      'mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                      isToday
                        ? 'bg-[#4A72E8] text-white'
                        : !isCur
                          ? 'text-slate-400'
                          : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayEvts.length > 0 && (
                    <span className="absolute top-2 right-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                      {dayEvts.length}
                    </span>
                  )}
                  <div className="space-y-1">
                    {dayEvts.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => setPopupEvent(evt)}
                        className={cn(
                          'cursor-pointer truncate rounded-md px-2 py-0.5 text-xs font-bold',
                          getEventStyles(evt.source, evt.color)
                        )}
                        title={`${evt.title} - ${format(new Date(evt.startDate), 'hh:mm a')}`}
                        style={
                          evt.source === 'admin'
                            ? { backgroundColor: evt.color, color: '#fff' }
                            : undefined
                        }
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvts.length > 3 && (
                      <div className="pl-1 text-xs font-bold text-slate-400">
                        +{dayEvts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Event Detail Popup */}
      {popupEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setPopupEvent(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-[28px] bg-white p-7 shadow-2xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close event details"
              onClick={() => setPopupEvent(null)}
              className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
            {popupEvent.editable && (
              <div className="absolute top-5 right-14 flex gap-1">
                <button
                  aria-label="Edit event"
                  onClick={() => openEdit(popupEvent)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  aria-label="Delete event"
                  onClick={() => handleDelete(popupEvent)}
                  className="rounded-full p-2 text-red-400 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="mb-5 flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white"
                style={{ backgroundColor: popupEvent.color }}
              >
                {popupEvent.title.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  {popupEvent.source === 'exam'
                    ? 'Exam Event'
                    : popupEvent.source === 'class'
                      ? 'Class Session'
                      : 'Admin Event'}
                </p>
                <AudienceBadge visibleTo={popupEvent.visibleTo} />
              </div>
            </div>
            <h3 className="mb-2 text-xl font-black text-slate-900 dark:text-white">
              {popupEvent.title}
            </h3>
            {popupEvent.description && (
              <p className="mb-4 text-sm text-slate-500">{popupEvent.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <CalendarDays className="h-3.5 w-3.5" />{' '}
                {format(new Date(popupEvent.startDate), 'MMM dd, hh:mm a')}
              </span>
              {popupEvent.endDate && (
                <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  → {format(new Date(popupEvent.endDate), 'hh:mm a')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-100 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {editingEvent ? 'Edit Event' : 'New Calendar Event'}
              </h3>
              <button
                aria-label="Close modal"
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Title *
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Event title..."
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 transition-colors outline-none focus:border-[#FF4F33] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 transition-colors outline-none focus:border-[#FF4F33] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Start *
                  </label>
                  <input
                    type="datetime-local"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-3 py-3 text-sm font-medium text-slate-900 transition-colors outline-none focus:border-[#FF4F33] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-3 py-3 text-sm font-medium text-slate-900 transition-colors outline-none focus:border-[#FF4F33] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
              {/* Audience selector */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Visible To
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormAudience(opt.value as 'ALL' | 'STUDENTS' | 'INSTRUCTORS' | 'EXAM_ONLY' | 'MODULAR' | 'FULL_TIME' | 'SPECIFIC_USER')}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 text-center text-xs font-bold transition-all',
                        formAudience === opt.value
                          ? 'border-[#FF4F33] bg-[#FF4F33]/5 text-[#FF4F33]'
                          : 'border-slate-100 text-slate-500 hover:border-slate-300 dark:border-slate-800'
                      )}
                    >
                      <opt.icon className="mb-0.5 h-4 w-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
                {formAudience === 'SPECIFIC_USER' && (
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      User ID / Email
                    </label>
                    <input
                      value={formTargetUserId}
                      onChange={(e) => setFormTargetUserId(e.target.value)}
                      placeholder="Enter user UUID or exact email..."
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-medium text-slate-900 transition-colors outline-none focus:border-[#FF4F33] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
              {/* Color picker */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={cn(
                        'h-8 w-8 rounded-full transition-transform',
                        formColor === c
                          ? 'scale-110 ring-2 ring-slate-400 ring-offset-2'
                          : 'hover:scale-110'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              {/* Recurrence */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Repeat
                </label>
                <select
                  value={formRecurrence}
                  onChange={(e) => setFormRecurrence(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 transition-colors outline-none focus:border-[#FF4F33] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="NONE">Does not repeat</option>
                  <option value="DAILY">Every day</option>
                  <option value="WEEKLY">Every week</option>
                  <option value="MONTHLY">Every month</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-full border-2 border-slate-100 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex-1 rounded-full bg-[#FF4F33] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF4F33]/20 transition-colors hover:bg-[#E6462D] disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
