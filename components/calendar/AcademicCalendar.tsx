'use client'

import { useState, useMemo, useTransition } from 'react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, addMonths, subMonths, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getHours, getMinutes, addHours } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Filter, BookOpen, GraduationCap, CalendarDays, Users, UserCheck, Globe, Pencil, Trash2, X, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface UnifiedCalendarEvent {
  id: string
  dbId: string
  title: string
  description?: string | null
  startDate: string
  endDate?: string | null
  color: string
  source: 'class' | 'exam' | 'admin' | 'personal'
  editable: boolean
  visibleTo: string
  recurrenceType?: string | null
  recurrenceDays?: string | null
  recurrenceUntil?: string | null
  targetUserId?: string | null
}

interface Props {
  events: UnifiedCalendarEvent[]
  initialDate?: Date
  currentUserId: string
  canCreate?: boolean
  onSave?: (data: any, editingEventId?: string) => Promise<{ error?: string }>
  onDelete?: (dbId: string) => Promise<{ error?: string }>
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

const COLOR_OPTIONS = [
  '#4A72E8', '#FF4F33', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4',
]

function getEventStyles(source: string, color: string) {
  if (source === 'exam') return 'bg-[#FF4F33] text-white'
  if (source === 'class') return 'bg-[#EBF1FF] text-[#4A72E8]'
  if (source === 'personal') return 'bg-amber-50 text-amber-700 border-l-4 border-amber-400'
  return 'text-white'
}

export default function AcademicCalendar({ events, initialDate, currentUserId, canCreate = false, onSave, onDelete }: Props) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date())
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Week')
  const [popupEvent, setPopupEvent] = useState<UnifiedCalendarEvent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<UnifiedCalendarEvent | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formColor, setFormColor] = useState('#4A72E8')
  const [formAudience, setFormAudience] = useState('ALL')
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
    const map: Record<string, UnifiedCalendarEvent[]> = {}
    events.forEach(evt => {
      const d = format(new Date(evt.startDate), 'yyyy-MM-dd')
      if (!map[d]) map[d] = []
      if (!map[d].some(e => e.id === evt.id)) map[d].push(evt)
    })
    return map
  }, [events])
  const currentDayEvents = useMemo(() => {
    const dayStr = format(currentDate, 'yyyy-MM-dd')
    return [...(eventsByDate[dayStr] || [])].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
  }, [currentDate, eventsByDate])

  const getPos = (evt: UnifiedCalendarEvent) => {
    const start = new Date(evt.startDate)
    const end = evt.endDate ? new Date(evt.endDate) : addHours(start, 1)
    const top = (getHours(start) + getMinutes(start) / 60) * hourHeight
    const height = Math.max(((end.getTime() - start.getTime()) / 3_600_000) * hourHeight, 24)
    return { top, height }
  }

  const openAdd = () => {
    setEditingEvent(null)
    setFormTitle(''); setFormDesc(''); setFormStart(''); setFormEnd('')
    setFormColor('#4A72E8')
    setFormAudience('ALL')
    setFormTargetUserId('')
    setFormRecurrence('NONE')
    setShowModal(true)
  }

  const openEdit = (evt: UnifiedCalendarEvent) => {
    setEditingEvent(evt)
    setFormTitle(evt.title); setFormDesc(evt.description || '')
    setFormStart(evt.startDate.slice(0, 16)); setFormEnd(evt.endDate?.slice(0, 16) || '')
    setFormColor(evt.color);    setFormAudience(evt.visibleTo)
    setFormTargetUserId(evt.targetUserId || '')
    setFormRecurrence(evt.recurrenceType || 'NONE')
    setPopupEvent(null); setShowModal(true)
  }

  const handleSave = () => {
    if (!onSave) return
    if (!formTitle.trim()) { toast.error('Title is required'); return }
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
      };
      const res = await onSave(data, editingEvent?.dbId)
      if (res.error) { toast.error(res.error) } else { toast.success(editingEvent ? 'Event updated!' : 'Event created!'); setShowModal(false) }
    })
  }

  const handleDelete = (evt: UnifiedCalendarEvent) => {
    if (!onDelete) return
    startTransition(async () => {
      const res = await onDelete(evt.dbId)
      if (res.error) { toast.error(res.error) } else { toast.success('Event deleted'); setPopupEvent(null) }
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
  const label = viewMode === 'Day'
    ? format(currentDate, 'EEEE, MMMM d, yyyy')
    : viewMode === 'Week'
      ? format(startOfRange, 'MMMM yyyy')
      : format(currentDate, 'MMMM yyyy')

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800 transition-colors"><ChevronLeft className="h-5 w-5 text-slate-500"/></button>
          <span className="font-black text-xl text-slate-900 dark:text-white min-w-[160px] text-center">{label}</span>
          <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800 transition-colors"><ChevronRight className="h-5 w-5 text-slate-500"/></button>
          <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">Today</button>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
            <button onClick={() => setViewMode('Month')} className={cn('px-5 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all', viewMode === 'Month' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-700')}>Month</button>
            <button onClick={() => setViewMode('Week')} className={cn('px-5 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all', viewMode === 'Week' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-700')}>Week</button>
            <button onClick={() => setViewMode('Day')} className={cn('px-5 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all', viewMode === 'Day' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-700')}>Day</button>
          </div>
          {canCreate && (
            <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-[#FF4F33] px-6 py-2 text-sm font-bold text-white hover:bg-[#E6462D] transition-all shadow-lg shadow-[#FF4F33]/20 hover:scale-105 active:scale-95">
              New Event <Plus className="h-4 w-4"/>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#4A72E8]" /> Classes</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#FF4F33]" /> Exams</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#8b5cf6]" /> Broadcasts</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-400" /> Personal</span>
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Daily Agenda</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{currentDayEvents.length}</span>
        </div>
        {currentDayEvents.length === 0 ? (
          <p className="py-4 text-sm font-medium text-slate-500">No events scheduled for this day.</p>
        ) : (
          currentDayEvents.map((evt) => (
            <button
              key={evt.id}
              onClick={() => setPopupEvent(evt)}
              className="flex w-full items-start gap-3 rounded-xl border border-slate-100 p-3 text-left dark:border-slate-800"
            >
              <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: evt.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{evt.title}</span>
                <span className="block text-xs font-medium text-slate-500">
                  {format(new Date(evt.startDate), 'hh:mm a')}{evt.endDate ? ` - ${format(new Date(evt.endDate), 'hh:mm a')}` : ''}
                </span>
              </span>
            </button>
          ))
        )}
      </div>

      {viewMode === 'Day' && (
        <div className="flex flex-col rounded-[32px] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-4 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-500">{format(currentDate, 'EEEE')}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{format(currentDate, 'MMMM d')}</h3>
          </div>
          <div className="max-h-[760px] overflow-y-auto">
            {timeSlots.map((hour) => {
              const hourEvents = currentDayEvents.filter((evt) => getHours(new Date(evt.startDate)) === hour)
              return (
                <div key={hour} className="grid min-h-[84px] grid-cols-[72px_1fr] border-b border-slate-100 dark:border-slate-800">
                  <div className="border-r border-slate-100 px-3 py-4 text-right text-xs font-bold text-slate-400 dark:border-slate-800">
                    {hour === 0 ? '12 am' : hour < 12 ? `${hour} am` : hour === 12 ? '12 pm' : `${hour - 12} pm`}
                  </div>
                  <div className="space-y-2 p-2">
                    {hourEvents.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => setPopupEvent(evt)}
                        title={`${evt.title} - ${format(new Date(evt.startDate), 'hh:mm a')}`}
                        className={cn('w-full rounded-2xl p-3 text-left text-sm font-black shadow-sm', getEventStyles(evt.source, evt.color))}
                        style={evt.source === 'admin' ? { backgroundColor: evt.color, color: '#fff' } : undefined}
                      >
                        <span className="block truncate">{evt.title}</span>
                        <span className="block text-xs font-bold opacity-80">{format(new Date(evt.startDate), 'hh:mm a')}{evt.endDate ? ` - ${format(new Date(evt.endDate), 'hh:mm a')}` : ''}</span>
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
        <div className="hidden md:flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="grid grid-cols-[80px_1fr] border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 border-r border-slate-100 dark:border-slate-800 flex items-center justify-center">
              <Clock className="h-4 w-4 text-slate-300" />
            </div>
            <div className="grid grid-cols-7">
              {weekDays.map(day => {
                const isToday = isSameDay(day, today)
                return (
                  <div key={day.toISOString()} className={cn('p-4 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0 relative', isToday && 'bg-blue-50/30 dark:bg-blue-900/10')}>
                    <div className={cn('text-[10px] font-black uppercase tracking-widest mb-1', isToday ? 'text-aerojet-blue' : 'text-slate-400')}>{format(day, 'EEE')}</div>
                    <div className={cn('text-xl font-black', isToday ? 'text-aerojet-blue' : 'text-slate-900 dark:text-white')}>{format(day, 'dd')}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex h-[720px] overflow-y-auto">
            <div className="grid grid-cols-[80px_1fr] w-full relative">
              <div className="border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                {timeSlots.map(h => (
                  <div key={h} className="h-[80px] relative">
                    <span className="absolute -top-3 left-0 w-full text-center text-[10px] font-black uppercase text-slate-400">
                      {h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 relative">
                <div className="absolute inset-0 pointer-events-none flex flex-col">
                  {timeSlots.map(h => <div key={h} className="h-[80px] border-b border-slate-100/50 dark:border-slate-800/50"/>)}
                </div>
                {weekDays.map((day, di) => <div key={di} className="border-r border-slate-100 dark:border-slate-800 last:border-r-0 h-[1920px]"/>)}
                {weekDays.map((day, di) => {
                  const dayStr = format(day, 'yyyy-MM-dd')
                  return (eventsByDate[dayStr] || []).map(evt => {
                    const { top, height } = getPos(evt)
                    return (
                      <div key={evt.id} onClick={() => setPopupEvent(evt)}
                        className="absolute left-1 right-1 cursor-pointer transition-transform hover:scale-[1.02] hover:z-10"
                        title={`${evt.title} - ${format(new Date(evt.startDate), 'hh:mm a')}`}
                        style={{ top: `${top}px`, height: `${height - 4}px`, gridColumnStart: di + 1, gridColumnEnd: di + 2 }}>
                        <div className={cn('w-full h-full rounded-2xl p-3 flex flex-col overflow-hidden shadow-sm border-l-4 transition-all hover:shadow-md', getEventStyles(evt.source, evt.color))}
                          style={evt.source === 'admin' ? { backgroundColor: evt.color, borderLeftColor: 'rgba(0,0,0,0.1)' } : undefined}>
                          <span className="font-black text-[11px] truncate leading-tight mb-1">{evt.title}</span>
                          <span className="text-[10px] font-bold opacity-80 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(evt.startDate), 'hh:mm a')}
                          </span>
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
        <div className="hidden md:flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-800">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-100 dark:border-slate-800 last:border-r-0">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, idx) => {
              const dayStr = format(day, 'yyyy-MM-dd')
              const dayEvts = eventsByDate[dayStr] || []
              const isToday = isSameDay(day, today)
              const isCur = day.getMonth() === currentDate.getMonth()
              return (
                <div key={idx} className={cn('min-h-[140px] p-2 border-r border-b border-slate-100 dark:border-slate-800 relative transition-colors', !isCur && 'bg-slate-50/30 dark:bg-slate-900/30', isToday && 'bg-blue-50/30 dark:bg-blue-900/10')}>
                  <span className={cn('inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-black mb-2', isToday ? 'bg-aerojet-blue text-white shadow-md shadow-aerojet-blue/20' : !isCur ? 'text-slate-400' : 'text-slate-900 dark:text-white')}>{format(day, 'd')}</span>
                  {dayEvts.length > 0 && (
                    <span className="absolute right-2 top-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                      {dayEvts.length}
                    </span>
                  )}
                  <div className="space-y-1.5">
                    {dayEvts.slice(0, 3).map(evt => (
                      <div key={evt.id} onClick={() => setPopupEvent(evt)}
                        className={cn('px-2 py-1.5 rounded-lg text-[10px] font-black truncate cursor-pointer transition-transform hover:scale-105', getEventStyles(evt.source, evt.color))}
                        title={`${evt.title} - ${format(new Date(evt.startDate), 'hh:mm a')}`}
                        style={evt.source === 'admin' ? { backgroundColor: evt.color, color: '#fff' } : undefined}>
                        {evt.title}
                      </div>
                    ))}
                    {dayEvts.length > 3 && <div className="text-[10px] font-black text-slate-400 pl-1 uppercase tracking-tighter">+{dayEvts.length - 3} more</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Event Detail Popup */}
      {popupEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md" onClick={() => setPopupEvent(null)}>
          <div className="w-full max-w-sm rounded-[32px] bg-white dark:bg-slate-900 shadow-2xl p-8 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: popupEvent.color }} />
            <button onClick={() => setPopupEvent(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="h-4 w-4"/></button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg" style={{ backgroundColor: popupEvent.color }}>
                {popupEvent.title.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{popupEvent.source}</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{popupEvent.title}</h3>
              </div>
            </div>

            <div className="space-y-4">
              {popupEvent.description && (
                <p className="text-sm text-slate-500 leading-relaxed dark:text-slate-400">{popupEvent.description}</p>
              )}
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                  <CalendarDays className="h-4 w-4 text-aerojet-blue" />
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-black">Date & Time</div>
                    {format(new Date(popupEvent.startDate), 'EEEE, MMM do')}
                    <div className="text-aerojet-blue">{format(new Date(popupEvent.startDate), 'hh:mm a')} {popupEvent.endDate && `— ${format(new Date(popupEvent.endDate), 'hh:mm a')}`}</div>
                  </div>
                </div>
              </div>

              {popupEvent.editable && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => openEdit(popupEvent)} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button onClick={() => handleDelete(popupEvent)} className="flex items-center justify-center w-12 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all dark:bg-red-950/20">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating/Editing (Only if onSave is provided) */}
      {showModal && onSave && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl">
           <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-slate-900 shadow-2xl p-8 border border-slate-100 dark:border-slate-800">
             {/* Simple form implementation for personal events or admin events */}
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                   <Sparkles className="h-5 w-5" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingEvent ? 'Edit Event' : 'New Event'}</h3>
               </div>
               <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><X className="h-5 w-5"/></button>
             </div>

             <div className="space-y-5">
               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Title</label>
                 <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="What's happening?" className="w-full rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-aerojet-blue transition-all shadow-sm"/>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Start Time</label>
                   <input type="datetime-local" value={formStart} onChange={e => setFormStart(e.target.value)} className="w-full rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-aerojet-blue transition-all"/>
                 </div>
                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">End Time</label>
                   <input type="datetime-local" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="w-full rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-aerojet-blue transition-all"/>
                 </div>
               </div>

               <button onClick={handleSave} disabled={isPending} className="w-full rounded-2xl bg-aerojet-blue py-5 text-sm font-black text-white hover:bg-blue-700 transition-all shadow-xl shadow-aerojet-blue/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest">
                 {isPending ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  )
}
