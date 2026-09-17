'use client'

import { useState } from 'react'

import { ChevronDown, ChevronUp, UserCheck, UserX, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Sitting {
  id: string
  dayNumber: number
  sessionType: string
  startTime: string
  capacity: number
  status: string
  examComponent: { course?: { code: string }; code: string }
  assignments: Array<{
    id: string
    userId: string
    seatId: string | null
    attendanceStatus: string
    user: { profile: { firstName: string; lastName: string } | null; email: string }
  }>
}

interface Props {
  sittings: Sitting[]
}

export default function ManifestPreview({ sittings }: Props) {
  const [expandedSitting, setExpandedSitting] = useState<string | null>(null)

  const totalCandidates = sittings.reduce((sum, s) => sum + s.assignments.length, 0)
  const totalAttended = sittings.reduce((sum, s) => sum + s.assignments.filter(a => a.attendanceStatus === 'PRESENT').length, 0)

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Exam Session Manifest</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sittings.length} sittings · {totalCandidates} candidates · {totalAttended} attended
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Sitting</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Component</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Day</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Session</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Date</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Capacity</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Assigned</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Attended</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {sittings.map((sitting) => {
              const attended = sitting.assignments.filter(a => a.attendanceStatus === 'PRESENT').length
              const isExpanded = expandedSitting === sitting.id
              return (
                <>
                  <tr
                    key={sitting.id}
                    className="cursor-pointer border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => setExpandedSitting(isExpanded ? null : sitting.id)}
                  >
                    <td className="px-3 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                      #{sitting.dayNumber}
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {sitting.examComponent.course?.code || sitting.examComponent.code}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {sitting.sessionType}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {format(new Date(sitting.startTime), 'dd MMM yyyy, h:mm a')}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {sitting.capacity}
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {sitting.assignments.length}
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {attended}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black ${
                        sitting.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        sitting.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {sitting.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td colSpan={9} className="px-3 py-4">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                          <h4 className="mb-3 text-xs font-black text-slate-500 uppercase">Candidates</h4>
                          <div className="space-y-2">
                            {sitting.assignments.map((assignment) => (
                              <div key={assignment.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-aerojet-blue/10 text-xs font-black text-aerojet-blue">
                                    {assignment.user.profile
                                      ? `${assignment.user.profile.firstName[0]}${assignment.user.profile.lastName[0]}`
                                      : assignment.user.email[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                      {assignment.user.profile
                                        ? `${assignment.user.profile.firstName} ${assignment.user.profile.lastName}`
                                        : assignment.user.email}
                                    </p>
                                    <p className="text-xs text-slate-400">Seat {assignment.seatId || 'Unassigned'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {assignment.attendanceStatus === 'PRESENT' ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                      <UserCheck className="h-3.5 w-3.5" /> Present
                                    </span>
                                  ) : assignment.attendanceStatus === 'ABSENT' ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
                                      <UserX className="h-3.5 w-3.5" /> Absent
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                      <Clock className="h-3.5 w-3.5" /> {assignment.attendanceStatus}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
