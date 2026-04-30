'use client'

import { useState, useMemo, useTransition } from 'react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, addMonths, subMonths, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getHours, getMinutes, addHours } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Filter, BookOpen, GraduationCap, CalendarDays, Users, UserCheck, Globe, Pencil, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createAdminCalendarEvent, updateAdminCalendarEvent, deleteAdminCalendarEvent } from '../actions'

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
  visibleTo: 'ALL' | 'STUDENTS' | 'INSTRUCTORS' | 'EXAM_ONLY' | 'MODULAR' | 'FULL_TIME' | 'SPECIFIC_USER'
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

const COLOR_OPTIONS = [
  '#4A72E8', '#FF4F33', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4',
]

function getEventStyles(source: string, color: string) {
  if (source === 'exam') return 'bg-[#FF4F33] text-white'
  if (source === 'class') return 'bg-[#EBF1FF] text-[#4A72E8]'
  return 'text-white'
}

function AudienceBadge({ visibleTo }: { visibleTo: string }) {
  if (visibleTo === 'STUDENTS') return <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">Students</span>
  if (visibleTo === 'INSTRUCTORS') return <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">Instructors</span>
  if (visibleTo === 'EXAM_ONLY') return <span className="ml-1 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">Exam Only</span>
  if (visibleTo === 'MODULAR') return <span className="ml-1 text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-full font-bold">Modular</span>
  if (visibleTo === 'FULL_TIME') return <span className="ml-1 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">Full Time</span>
  if (visibleTo === 'SPECIFIC_USER') return <span className="ml-1 text-xs bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold">Specific User</span>
  return <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">All</span>
}

export default function StaffCalendarGrid({ events, initialDate, currentUserId }: Props) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date())
  const [viewMode, setViewMode] = useState<'Month' | 'Week'>('Week')
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
  const [formAudience, setFormAudience] = useState<'ALL' | 'STUDENTS' | 'INSTRUCTORS' | 'EXAM_ONLY' | 'MODULAR' | 'FULL_TIME' | 'SPECIFIC_USER'>('ALL')
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
    events.forEach(evt => {
      const d = format(new Date(evt.startDate), 'yyyy-MM-dd')
      if (!map[d]) map[d] = []
      if (!map[d].some(e => e.id === evt.id)) map[d].push(evt)
    })
    return map
  }, [events])

  const getPos = (evt: StaffCalendarEvent) => {
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

  const openEdit = (evt: StaffCalendarEvent) => {
    setEditingEvent(evt)
    setFormTitle(evt.title); setFormDesc(evt.description || '')
    setFormStart(evt.startDate.slice(0, 16)); setFormEnd(evt.endDate?.slice(0, 16) || '')
    setFormColor(evt.color);    setFormAudience(evt.visibleTo as any)
    setFormTargetUserId(evt.targetUserId || '')
    setFormRecurrence(evt.recurrenceType || 'NONE')
    setPopupEvent(null); setShowModal(true)
  }

  const handleSave = () => {
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
    const res = editingEvent
        ? await updateAdminCalendarEvent(editingEvent.dbId, data)
        : await createAdminCalendarEvent(data)
      if (res.error) { toast.error(res.error) } else { toast.success(editingEvent ? 'Event updated!' : 'Event created!'); setShowModal(false) }
    })
  }

  const handleDelete = (evt: StaffCalendarEvent) => {
    startTransition(async () => {
      const res = await deleteAdminCalendarEvent(evt.dbId)
      if (res.error) { toast.error(res.error) } else { toast.success('Event deleted'); setPopupEvent(null) }
    })
  }

  const handlePrev = () => viewMode === 'Week' ? setCurrentDate(subWeeks(currentDate, 1)) : setCurrentDate(subMonths(currentDate, 1))
  const handleNext = () => viewMode === 'Week' ? setCurrentDate(addWeeks(currentDate, 1)) : setCurrentDate(addMonths(currentDate, 1))
  const label = viewMode === 'Week' ? format(startOfRange, 'MMMM yyyy') : format(currentDate, 'MMMM yyyy')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between rounded-2xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Calendar</h2>
          <p className="mt-1 text-sm text-slate-500">Manage and broadcast institutional events across all portals</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#4A72E8]"/> Class Sessions</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#FF4F33]"/> Exam Events</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#8b5cf6]"/> Admin Events</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800 transition-colors"><ChevronLeft className="h-5 w-5 text-slate-500"/></button>
          <span className="font-black text-xl text-slate-900 dark:text-white min-w-[160px] text-center">{label}</span>
          <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800 transition-colors"><ChevronRight className="h-5 w-5 text-slate-500"/></button>
          <button onClick={() => setCurrentDate(new Date())} className="hidden md:block text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">Today</button>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <button onClick={() => setViewMode('Month')} className={cn('px-5 py-2.5 text-sm font-bold rounded-l-full transition-colors', viewMode === 'Month' ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}>Month</button>
            <button onClick={() => setViewMode('Week')} className={cn('px-5 py-2.5 text-sm font-bold rounded-r-full transition-colors border-l border-slate-200 dark:border-slate-700', viewMode === 'Week' ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}>Week</button>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 rounded-full bg-[#FF4F33] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#E6462D] transition-colors shadow-md shadow-[#FF4F33]/20">
            New Event <Plus className="h-4 w-4"/>
          </button>
        </div>
      </div>

      {/* Week View */}
      {viewMode === 'Week' && (
        <div className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="grid grid-cols-[80px_1fr] border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 border-r border-slate-100 dark:border-slate-800"/>
            <div className="grid grid-cols-7">
              {weekDays.map(day => {
                const isToday = isSameDay(day, today)
                return (
                  <div key={day.toISOString()} className={cn('p-4 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0 relative', isToday && 'bg-[#F8FBFF] dark:bg-blue-900/10')}>
                    {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-[#4A72E8]"/>}
                    <span className={cn('text-sm font-bold', isToday ? 'text-[#4A72E8]' : 'text-slate-700 dark:text-white')}>{format(day, 'EEE, dd')}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex h-[720px] overflow-y-auto">
            <div className="grid grid-cols-[80px_1fr] w-full relative">
              <div className="border-r border-slate-100 dark:border-slate-800">
                {timeSlots.map(h => (
                  <div key={h} className="h-[80px] relative">
                    <span className="absolute -top-3 left-0 w-full text-center text-xs font-medium text-slate-400">
                      {h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 relative">
                <div className="absolute inset-0 pointer-events-none flex flex-col">
                  {timeSlots.map(h => <div key={h} className="h-[80px] border-b border-slate-100 dark:border-slate-800"/>)}
                </div>
                {weekDays.map((day, di) => <div key={di} className="border-r border-slate-100 dark:border-slate-800 last:border-r-0 h-[1920px]"/>)}
                {weekDays.map((day, di) => {
                  const dayStr = format(day, 'yyyy-MM-dd')
                  return (eventsByDate[dayStr] || []).map(evt => {
                    const { top, height } = getPos(evt)
                    return (
                      <div key={evt.id} onClick={() => setPopupEvent(evt)}
                        className="absolute left-1 right-1 cursor-pointer transition-transform hover:scale-[1.01] hover:z-10"
                        style={{ top: `${top}px`, height: `${height - 4}px`, gridColumnStart: di + 1, gridColumnEnd: di + 2 }}>
                        <div className={cn('w-full h-full rounded-xl p-2 flex flex-col overflow-hidden shadow-sm', getEventStyles(evt.source, evt.color))}
                          style={evt.source === 'admin' ? { backgroundColor: evt.color } : undefined}>
                          <span className="font-bold text-xs truncate leading-tight">{evt.title}</span>
                          <span className="text-xs opacity-80 truncate">{format(new Date(evt.startDate), 'hh:mm a')}</span>
                          <AudienceBadge visibleTo={evt.visibleTo}/>
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
        <div className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-[#F8FBFF] dark:bg-blue-900/10 dark:border-slate-800">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="p-4 text-center text-sm font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 last:border-r-0">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, idx) => {
              const dayStr = format(day, 'yyyy-MM-dd')
              const dayEvts = eventsByDate[dayStr] || []
              const isToday = isSameDay(day, today)
              const isCur = day.getMonth() === currentDate.getMonth()
              return (
                <div key={idx} className={cn('min-h-[110px] p-2 border-r border-b border-slate-100 dark:border-slate-800 relative', !isCur && 'bg-slate-50/50 dark:bg-slate-900/50', isToday && 'bg-[#F8FBFF] dark:bg-blue-900/10')}>
                  {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-[#4A72E8]"/>}
                  <span className={cn('inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-bold mb-1', isToday ? 'bg-[#4A72E8] text-white' : !isCur ? 'text-slate-400' : 'text-slate-900 dark:text-white')}>{format(day, 'd')}</span>
                  <div className="space-y-1">
                    {dayEvts.slice(0, 3).map(evt => (
                      <div key={evt.id} onClick={() => setPopupEvent(evt)}
                        className={cn('px-2 py-0.5 rounded-md text-xs font-bold truncate cursor-pointer', getEventStyles(evt.source, evt.color))}
                        style={evt.source === 'admin' ? { backgroundColor: evt.color, color: '#fff' } : undefined}>
                        {evt.title}
                      </div>
                    ))}
                    {dayEvts.length > 3 && <div className="text-xs font-bold text-slate-400 pl-1">+{dayEvts.length - 3} more</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Event Detail Popup */}
      {popupEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPopupEvent(null)}>
          <div className="w-full max-w-sm rounded-[28px] bg-white dark:bg-slate-900 shadow-2xl p-7 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPopupEvent(null)} className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="h-4 w-4"/></button>
            {popupEvent.editable && (
              <div className="absolute top-5 right-14 flex gap-1">
                <button onClick={() => openEdit(popupEvent)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><Pencil className="h-4 w-4"/></button>
                <button onClick={() => handleDelete(popupEvent)} className="p-2 rounded-full hover:bg-red-50 text-red-400"><Trash2 className="h-4 w-4"/></button>
              </div>
            )}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: popupEvent.color }}>{popupEvent.title.charAt(0).toUpperCase()}</div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{popupEvent.source === 'exam' ? 'Exam Event' : popupEvent.source === 'class' ? 'Class Session' : 'Admin Event'}</p>
                <AudienceBadge visibleTo={popupEvent.visibleTo}/>
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{popupEvent.title}</h3>
            {popupEvent.description && <p className="text-sm text-slate-500 mb-4">{popupEvent.description}</p>}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200">
                <CalendarDays className="h-3.5 w-3.5"/> {format(new Date(popupEvent.startDate), 'MMM dd, hh:mm a')}
              </span>
              {popupEvent.endDate && (
                <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200">
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
          <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-slate-900 shadow-2xl p-8 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingEvent ? 'Edit Event' : 'New Calendar Event'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="h-5 w-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Title *</label>
                <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Event title..." className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#FF4F33] transition-colors"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#FF4F33] transition-colors resize-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Start *</label>
                  <input type="datetime-local" value={formStart} onChange={e => setFormStart(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-3 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#FF4F33] transition-colors"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">End</label>
                  <input type="datetime-local" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-3 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#FF4F33] transition-colors"/>
                </div>
              </div>
              {/* Audience selector */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Visible To</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AUDIENCE_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setFormAudience(opt.value as any)}
                      className={cn('flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border-2 text-xs font-bold transition-all text-center', formAudience === opt.value ? 'border-[#FF4F33] bg-[#FF4F33]/5 text-[#FF4F33]' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300')}>
                      <opt.icon className="h-4 w-4 mb-0.5"/>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {formAudience === 'SPECIFIC_USER' && (
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">User ID / Email</label>
                    <input value={formTargetUserId} onChange={e => setFormTargetUserId(e.target.value)} placeholder="Enter user UUID or exact email..." className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#FF4F33] transition-colors"/>
                  </div>
                )}
              </div>
              {/* Color picker */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} type="button" onClick={() => setFormColor(c)}
                      className={cn('w-8 h-8 rounded-full transition-transform', formColor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110')}
                      style={{ backgroundColor: c }}/>
                  ))}
                </div>
              </div>
              {/* Recurrence */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Repeat</label>
                <select value={formRecurrence} onChange={e => setFormRecurrence(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#FF4F33] transition-colors">
                  <option value="NONE">Does not repeat</option>
                  <option value="DAILY">Every day</option>
                  <option value="WEEKLY">Every week</option>
                  <option value="MONTHLY">Every month</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 rounded-full border-2 border-slate-100 dark:border-slate-800 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={isPending} className="flex-1 rounded-full bg-[#FF4F33] py-3.5 text-sm font-bold text-white hover:bg-[#E6462D] transition-colors shadow-lg shadow-[#FF4F33]/20 disabled:opacity-50">
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
