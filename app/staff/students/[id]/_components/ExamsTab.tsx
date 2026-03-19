'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  FileCheck,
  ShoppingCart,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import { updateExamBooking, deleteExamRecord } from '@/app/staff/actions'
import BookExamForStudentDialog from './BookExamForStudentDialog'
import AddExamRecordDialog from './AddExamRecordDialog'

const EXAM_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'passed', label: 'Passed' },
  { key: 'failed', label: 'Failed' },
  { key: 'resit', label: 'Resit' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
] as const

type ExamFilter = (typeof EXAM_FILTERS)[number]['key']

interface Props {
  student: any
  examComponents: any[]
  upcomingEvents: any[]
  academicYears?: { id: string; name: string }[]
  semesters?: { id: string; name: string }[]
  onRefresh: () => void
}

export default function ExamsTab({
  student,
  examComponents,
  upcomingEvents,
  academicYears,
  semesters,
  onRefresh,
}: Props) {
  const [filter, setFilter] = useState<ExamFilter>('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    score?: number
    result?: string
    examDate?: string
    moduleCode?: string
  }>({})

  // Merge exam bookings and exam results into unified history
  const allExamRecords = useMemo(() => {
    const records: any[] = []

    // From examBookings
    for (const b of student.examBookings || []) {
      records.push({
        id: b.id,
        source: 'booking',
        moduleCode: b.moduleCode || b.course?.code || b.exam?.examComponent?.course?.code || '—',
        examName:
          b.exam?.name || b.course?.name || b.exam?.examComponent?.course?.name || 'Manual Record',
        examDate: b.examDate,
        score: b.score != null ? Number(b.score) : null,
        percentage: b.percentage != null ? Number(b.percentage) : null,
        result: b.result,
        passed: b.result?.toLowerCase() === 'pass',
        status: b.status,
        bookingType: b.bookingType,
        attemptType: b.attemptType,
        isResit: b.isResit,
        eventName: b.event?.name,
        sourceNotes: b.sourceNotes,
        bookedAt: b.bookedAt,
        amountPaid: Number(b.amountPaid || 0),
      })
    }

    // From examResults (formal results)
    for (const r of student.examResults || []) {
      const existingBooking = records.find(
        (rec) =>
          rec.source === 'booking' &&
          rec.moduleCode === (r.exam?.examComponent?.course?.code || '') &&
          rec.score === Number(r.score)
      )
      if (!existingBooking) {
        records.push({
          id: `result_${r.id}`,
          source: 'result',
          moduleCode: r.exam?.examComponent?.course?.code || '—',
          examName: r.exam?.name || '—',
          examDate: r.exam?.examDate,
          score: Number(r.score),
          percentage: Number(r.percentage),
          result: r.passed ? 'pass' : 'fail',
          passed: r.passed,
          status: 'COMPLETED',
          bookingType: null,
          attemptType: null,
          isResit: false,
          eventName: null,
          sourceNotes: null,
          bookedAt: r.createdAt,
          certificateUrl: r.certificateUrl,
          amountPaid: 0,
        })
      }
    }

    // Sort by date descending
    records.sort((a, b) => {
      const da = a.examDate ? new Date(a.examDate).getTime() : 0
      const db = b.examDate ? new Date(b.examDate).getTime() : 0
      return db - da
    })

    return records
  }, [student.examBookings, student.examResults])

  // Apply filters
  const filteredRecords = useMemo(() => {
    let filtered = allExamRecords

    if (filter === 'passed') {
      filtered = filtered.filter((r) => r.passed || r.result?.toLowerCase() === 'pass')
    } else if (filter === 'failed') {
      filtered = filtered.filter((r) => !r.passed && r.result?.toLowerCase() === 'fail')
    } else if (filter === 'resit') {
      filtered = filtered.filter(
        (r) => r.isResit || ['RESIT_1', 'RESIT_2', 'RESIT_3'].includes(r.attemptType || '')
      )
    } else if (filter === 'upcoming') {
      filtered = filtered.filter(
        (r) => r.examDate && new Date(r.examDate) > new Date() && r.status !== 'COMPLETED'
      )
    } else if (filter === 'completed') {
      filtered = filtered.filter((r) => r.status === 'COMPLETED')
    }

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (r) => r.moduleCode?.toLowerCase().includes(q) || r.examName?.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [allExamRecords, filter, search])

  // Filter counts
  const counts = useMemo(
    () => ({
      all: allExamRecords.length,
      passed: allExamRecords.filter((r) => r.passed || r.result?.toLowerCase() === 'pass').length,
      failed: allExamRecords.filter((r) => !r.passed && r.result?.toLowerCase() === 'fail').length,
      resit: allExamRecords.filter(
        (r) => r.isResit || ['RESIT_1', 'RESIT_2', 'RESIT_3'].includes(r.attemptType || '')
      ).length,
      upcoming: allExamRecords.filter(
        (r) => r.examDate && new Date(r.examDate) > new Date() && r.status !== 'COMPLETED'
      ).length,
      completed: allExamRecords.filter((r) => r.status === 'COMPLETED').length,
    }),
    [allExamRecords]
  )

  // Handle inline edit save
  const handleSaveEdit = async (recordId: string) => {
    try {
      const res = await updateExamBooking(recordId, {
        score: editData.score,
        result: editData.result,
        examDate: editData.examDate ? new Date(editData.examDate) : undefined,
        moduleCode: editData.moduleCode || undefined,
      })
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Exam record updated')
        setEditingId(null)
        onRefresh()
      }
    } catch {
      toast.error('Failed to update record')
    }
  }

  // Handle delete
  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this exam record?')) return
    try {
      const res = await deleteExamRecord(recordId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Exam record deleted')
        onRefresh()
      }
    } catch {
      toast.error('Failed to delete record')
    }
  }

  const walletBalance = Number(student.wallet?.availableBalance ?? 0)

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
            Exam Records ({allExamRecords.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <AddExamRecordDialog
            studentId={student.id}
            studentName={
              student.profile
                ? `${student.profile.firstName} ${student.profile.lastName}`
                : student.email
            }
            examComponents={examComponents}
            onSuccess={onRefresh}
          />
          <BookExamForStudentDialog
            studentId={student.id}
            studentName={
              student.profile
                ? `${student.profile.firstName} ${student.profile.lastName}`
                : student.email
            }
            walletBalance={walletBalance}
            walletCurrency={student.wallet?.currency || 'EUR'}
            enrollmentType={student.studentProfile?.enrollmentType}
            academicYears={academicYears}
            semesters={semesters}
            examComponents={examComponents}
            upcomingEvents={upcomingEvents}
            onSuccess={onRefresh}
          />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search module or exam..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 focus:ring-[#4c9ded] dark:border-slate-700 dark:bg-slate-800/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {EXAM_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'border-[#002a5c] bg-[#002a5c] text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              {f.label}
              <span className="ml-1 opacity-60">({counts[f.key]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={CheckCircle2}
          label="Passed"
          value={counts.passed}
          color="text-emerald-600"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <SummaryCard
          icon={XCircle}
          label="Failed"
          value={counts.failed}
          color="text-red-600"
          bg="bg-red-50 dark:bg-red-900/20"
        />
        <SummaryCard
          icon={Clock}
          label="Upcoming"
          value={counts.upcoming}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <SummaryCard
          icon={FileCheck}
          label="Total Records"
          value={counts.all}
          color="text-slate-600"
          bg="bg-slate-50 dark:bg-slate-800"
        />
      </div>

      {/* Exam Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileCheck className="mb-2 h-10 w-10 text-slate-200" />
          <p className="text-sm font-bold text-slate-400">
            {filter === 'all' ? 'No exam records yet' : `No ${filter} exam records`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50">
                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Module
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Exam / Event
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Score
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Result
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3">
                    {editingId === record.id ? (
                      <input
                        type="text"
                        value={editData.moduleCode ?? record.moduleCode}
                        onChange={(e) => setEditData((d) => ({ ...d, moduleCode: e.target.value }))}
                        className="w-20 rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                      />
                    ) : (
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {record.moduleCode}
                      </span>
                    )}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-xs text-slate-500">
                    <div>
                      <span className="font-medium">{record.examName}</span>
                      {record.eventName && (
                        <span className="ml-1 text-slate-400">({record.eventName})</span>
                      )}
                    </div>
                    {record.attemptType && (
                      <span className="text-[10px] text-slate-400">
                        {record.attemptType.replace(/_/g, ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {editingId === record.id ? (
                      <input
                        type="date"
                        value={
                          editData.examDate ??
                          (record.examDate
                            ? new Date(record.examDate).toISOString().split('T')[0]
                            : '')
                        }
                        onChange={(e) => setEditData((d) => ({ ...d, examDate: e.target.value }))}
                        className="rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                    ) : record.examDate ? (
                      new Date(record.examDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === record.id ? (
                      <input
                        type="number"
                        value={editData.score ?? record.score ?? ''}
                        onChange={(e) =>
                          setEditData((d) => ({
                            ...d,
                            score: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        className="w-16 rounded border border-slate-200 px-2 py-1 text-center font-mono text-xs"
                        min={0}
                        max={100}
                      />
                    ) : (
                      <span className="font-mono text-xs font-black">
                        {record.score != null ? `${record.score}%` : '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {record.result ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                          record.result?.toLowerCase() === 'pass'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {record.result}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {record.bookingType && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800">
                        {record.bookingType.replace(/_/g, ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        record.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : record.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : record.status === 'FAILED' || record.status === 'NO_SHOW'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {record.source === 'booking' && (
                      <div className="flex items-center justify-end gap-1">
                        {editingId === record.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(record.id)}
                              className="rounded bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white transition-colors hover:bg-emerald-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null)
                                setEditData({})
                              }}
                              className="rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(record.id)
                                setEditData({
                                  score: record.score,
                                  moduleCode: record.moduleCode,
                                  examDate: record.examDate
                                    ? new Date(record.examDate).toISOString().split('T')[0]
                                    : '',
                                })
                              }}
                              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bundles */}
      {student.examBundles?.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-black tracking-widest text-slate-400 uppercase">
            Active Bundles
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {student.examBundles.map((bundle: any) => (
              <div
                key={bundle.id}
                className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {bundle.bundleType.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                      bundle.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {bundle.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                  <span>
                    Seats: {bundle.usedSeats}/{bundle.totalSeats}
                  </span>
                  <span>Paid: €{Number(bundle.amountPaid).toFixed(2)}</span>
                  {bundle.validUntil && (
                    <span>
                      Valid until:{' '}
                      {new Date(bundle.validUntil).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: any
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className={`rounded-xl border border-slate-100 p-4 dark:border-slate-800 ${bg}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          {label}
        </span>
      </div>
      <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
    </div>
  )
}
