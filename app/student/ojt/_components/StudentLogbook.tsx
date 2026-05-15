'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  FileCheck,
  Loader2,
  Pen,
} from 'lucide-react'

interface Entry {
  id: string
  date: string
  aircraftType: string
  aircraftRegistration: string
  ataChapter: { code: string; title: string; category: string }
  taskDescription: string
  workOrderReference: string | null
  maintenanceManualRef: string | null
  maintenanceType: string
  durationHours: number
  supervisorSignature: boolean
  studentSignature: boolean
  verifiedByManagement: boolean
  licenceCategory: string | null
  workEnvironment: string | null
  toolsUsed: string | null
  competencyRating: number | null
}

interface LogbookData {
  id: string
  licenceCategory: string
  facilityName: string
  facilityApprovalNo: string | null
  startDate: string
  targetEndDate: string | null
  totalLoggedHours: number
  status: string
  entries: Entry[]
  analytics: {
    totalHours: number
    hoursByType: Record<string, number>
    ataChaptersCovered: number
    signedEntries: number
    unsignedEntries: number
  }
}

const TYPE_COLORS: Record<string, string> = {
  LINE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  BASE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPONENT_OVERHAUL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ENGINE_OVERHAUL: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  MODIFICATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REPAIR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  TROUBLESHOOTING: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  INSPECTION: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  SERVICING: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  NDT: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

export default function StudentLogbook({ data }: { data: LogbookData }) {
  const router = useRouter()
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [signing, setSigning] = useState<string | null>(null)

  const handleSign = async (entryId: string) => {
    setSigning(entryId)
    try {
      const res = await fetch('/api/student/ojt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      })
      if (res.ok) {
        toast.success('Entry signed successfully')
        router.refresh()
      } else {
        toast.error('Failed to sign entry')
      }
    } finally {
      setSigning(null)
    }
  }

  const a = data.analytics

  return (
    <div className="space-y-4">
      {/* Info bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
          {data.licenceCategory}
        </span>
        <span className="text-sm text-slate-500">
          Started: {format(new Date(data.startDate), 'MMM d, yyyy')}
        </span>
        {data.targetEndDate && (
          <span className="text-sm text-slate-500">
            Target: {format(new Date(data.targetEndDate), 'MMM d, yyyy')}
          </span>
        )}
        <span
          className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${
            data.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : data.status === 'COMPLETED'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}
        >
          {data.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Clock className="h-3.5 w-3.5" /> Total Hours
          </div>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-white">{a.totalHours}h</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Entries</div>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-white">{data.entries.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Shield className="h-3.5 w-3.5" /> ATA Chapters
          </div>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-white">{a.ataChaptersCovered}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-500">
            <FileCheck className="h-3.5 w-3.5" /> Signed
          </div>
          <div className="mt-1 text-2xl font-black text-green-600">{a.signedEntries}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Signature</div>
          <div className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">{a.unsignedEntries}</div>
        </div>
      </div>

      {/* Hours by type */}
      {Object.keys(a.hoursByType).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(a.hoursByType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, hours]) => (
              <span key={type} className={`rounded-full px-3 py-1 text-xs font-bold ${TYPE_COLORS[type] || 'bg-slate-100 text-slate-600'}`}>
                {type.replace(/_/g, ' ')}: {hours}h
              </span>
            ))}
        </div>
      )}

      {/* Entries Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Aircraft</th>
              <th className="px-4 py-3 font-medium">ATA</th>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Signed</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No logbook entries yet. Your supervisor will add entries as you complete tasks.
                </td>
              </tr>
            ) : (
              data.entries.map((entry) => (
                <>
                  <tr
                    key={entry.id}
                    onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {format(new Date(entry.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 dark:text-white">{entry.aircraftType}</div>
                      <div className="text-xs text-slate-500">{entry.aircraftRegistration}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {entry.ataChapter.code}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600 dark:text-slate-300">
                      {entry.taskDescription}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_COLORS[entry.maintenanceType] || ''}`}>
                        {entry.maintenanceType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{entry.durationHours}h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {entry.supervisorSignature ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-300" />
                        )}
                        {entry.studentSignature ? (
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSign(entry.id)
                            }}
                            disabled={signing === entry.id}
                            className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            {signing === entry.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Pen className="h-3 w-3" />
                            )}
                            Sign
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {expandedEntry === entry.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </td>
                  </tr>
                  {expandedEntry === entry.id && (
                    <tr key={`${entry.id}-detail`}>
                      <td colSpan={8} className="bg-slate-50 px-6 py-4 dark:bg-slate-800/30">
                        <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <span className="font-bold text-slate-400">ATA Chapter</span>
                            <p className="text-slate-700 dark:text-slate-300">{entry.ataChapter.code} — {entry.ataChapter.title}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-bold text-slate-400">Full Description</span>
                            <p className="text-slate-700 dark:text-slate-300">{entry.taskDescription}</p>
                          </div>
                          {entry.workOrderReference && (
                            <div>
                              <span className="font-bold text-slate-400">Work Order</span>
                              <p className="text-slate-700 dark:text-slate-300">{entry.workOrderReference}</p>
                            </div>
                          )}
                          {entry.maintenanceManualRef && (
                            <div>
                              <span className="font-bold text-slate-400">Manual Reference</span>
                              <p className="text-slate-700 dark:text-slate-300">{entry.maintenanceManualRef}</p>
                            </div>
                          )}
                          {entry.licenceCategory && (
                            <div>
                              <span className="font-bold text-slate-400">Licence Category</span>
                              <p className="text-slate-700 dark:text-slate-300">{entry.licenceCategory}</p>
                            </div>
                          )}
                          {entry.workEnvironment && (
                            <div>
                              <span className="font-bold text-slate-400">Work Environment</span>
                              <p className="text-slate-700 dark:text-slate-300">{entry.workEnvironment}</p>
                            </div>
                          )}
                          {entry.toolsUsed && (
                            <div>
                              <span className="font-bold text-slate-400">Tools / Equipment</span>
                              <p className="text-slate-700 dark:text-slate-300">{entry.toolsUsed}</p>
                            </div>
                          )}
                          {entry.competencyRating && (
                            <div>
                              <span className="font-bold text-slate-400">Competency</span>
                              <p className="text-slate-700 dark:text-slate-300">{entry.competencyRating}/5</p>
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-400">Verification</span>
                            <div className="mt-1 space-y-0.5">
                              <div className="flex items-center gap-1">
                                {entry.supervisorSignature ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-slate-300" />}
                                <span>Supervisor</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {entry.studentSignature ? <CheckCircle2 className="h-3 w-3 text-blue-500" /> : <XCircle className="h-3 w-3 text-slate-300" />}
                                <span>Student (You)</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {entry.verifiedByManagement ? <CheckCircle2 className="h-3 w-3 text-purple-500" /> : <XCircle className="h-3 w-3 text-slate-300" />}
                                <span>Management</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
