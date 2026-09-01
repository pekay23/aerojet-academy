'use client'

import { useState, useMemo } from 'react'
import { Plus, Calendar, CheckCircle, XCircle, AlertTriangle, ShieldCheck, UserCheck, X, Loader2, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useConfirmDialog } from '@/hooks/use-confirm-dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useToast } from '@/hooks/use-toast'

type PracticalResult = 'SATISFACTORY' | 'UNSATISFACTORY' | 'NEEDS_REVIEW'
type PracticalTaskCategory = 'P1' | 'P2'
type PracticalDeliveryMethod = 'TASK_PERFORMANCE' | 'DEMONSTRATION' | 'TECHNICAL_DISCUSSION' | 'SIMULATION'

interface RecordItem {
  id: string
  date: string
  studentProfileId: string
  courseId: string
  taskCategory: PracticalTaskCategory
  taskReference: string | null
  ataChapterId: string | null
  description: string
  deliveryMethod: PracticalDeliveryMethod
  durationMinutes: number
  result: PracticalResult | null
  signedByInstructor: boolean
  signedByStudent: boolean
  assessorNotes: string | null
  course: { id: string; code: string; name: string }
  ataChapter: { id: string; code: string; title: string } | null
  instructorId: string
  instructor: { id: string; profile: { firstName: string; lastName: string } | null }
  studentProfile: {
    id: string
    studentId: string
    user: { profile: { firstName: string; lastName: string } | null }
  }
}

const DEFAULT_FORM = {
  studentProfileId: '',
  courseId: '',
  taskCategory: 'P1' as PracticalTaskCategory,
  taskReference: '',
  ataChapterId: '',
  description: '',
  deliveryMethod: 'TASK_PERFORMANCE' as PracticalDeliveryMethod,
  date: new Date().toISOString().split('T')[0],
  durationMinutes: 60,
  instructorId: '',
  result: '' as PracticalResult | '',
  assessorNotes: '',
}

export default function PracticalAssessmentsClient({
  initialRecords,
  courses,
  students,
  instructors,
  ataChapters,
}: {
  initialRecords: any[]
  courses: any[]
  students: any[]
  instructors: any[]
  ataChapters: any[]
}) {
  const router = useRouter()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const [records, setRecords] = useState<RecordItem[]>(initialRecords as unknown as RecordItem[])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)
  
  // Filters state
  const [studentFilter, setStudentFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('')

  // New Record Form state
  const [formData, setFormData] = useState(DEFAULT_FORM)

  const handleCreateClick = () => {
    setFormData(DEFAULT_FORM)
    setEditingId(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (rec: RecordItem) => {
    setEditingId(rec.id)
    setFormData({
      studentProfileId: rec.studentProfileId,
      courseId: rec.courseId,
      taskCategory: rec.taskCategory,
      taskReference: rec.taskReference || '',
      ataChapterId: rec.ataChapterId || '',
      description: rec.description,
      deliveryMethod: rec.deliveryMethod,
      date: new Date(rec.date).toISOString().split('T')[0],
      durationMinutes: rec.durationMinutes,
      instructorId: rec.instructorId,
      result: rec.result || '',
      assessorNotes: rec.assessorNotes || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsActionPending(true)
    try {
      const payload = {
        ...formData,
        durationMinutes: Number(formData.durationMinutes),
        result: formData.result || undefined,
      }

      const isEditing = !!editingId
      const url = isEditing ? `/api/staff/practical-training/${editingId}` : '/api/staff/practical-training'
      const method = isEditing ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { ...payload, isFullEdit: true } : payload),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to save practical record')
      } else {
        toast.success(isEditing ? 'Practical record updated successfully!' : 'Practical assessment record saved successfully!')
        setIsModalOpen(false)
        window.location.reload()
      }
    } catch (error) {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsActionPending(false)
    }
  }

  const signRecord = (id: string, approve: boolean) => {
    confirmDialog.confirm({
      title: approve ? 'Approve and Sign' : 'Sign Record',
      description: approve 
        ? 'Are you sure you want to sign this practical record as Satisfactory? This will mark the task as complete.'
        : 'Are you sure you want to apply your instructor signature to this record?',
      onConfirm: async () => {
        setIsActionPending(true)
        try {
          const res = await fetch(`/api/staff/practical-training/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              signedByInstructor: true,
              result: approve ? 'SATISFACTORY' : undefined,
            }),
          })
          if (res.ok) {
            toast.success('Record signed successfully.')
            window.location.reload()
          } else {
            toast.error('Failed to sign record.')
          }
        } catch {
          toast.error('An unexpected error occurred.')
        } finally {
          setIsActionPending(false)
          confirmDialog.close()
        }
      }
    })
  }

  const deleteRecord = (id: string) => {
    confirmDialog.confirm({
      title: 'Delete Practical Record',
      description: 'Are you sure you want to permanently delete this record? This action cannot be undone.',
      onConfirm: async () => {
        setIsActionPending(true)
        try {
          const res = await fetch(`/api/staff/practical-training/${id}`, {
            method: 'DELETE',
          })
          if (res.ok) {
            toast.success('Record deleted successfully.')
            window.location.reload()
          } else {
            const err = await res.json()
            toast.error(err.error || 'Failed to delete record.')
          }
        } catch {
          toast.error('An unexpected error occurred.')
        } finally {
          setIsActionPending(false)
          confirmDialog.close()
        }
      }
    })
  }

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const profile = rec.studentProfile?.user?.profile
      const stdName = profile ? `${profile.firstName} ${profile.lastName}`.toLowerCase() : ''
      const matchesStd = studentFilter === '' || rec.studentProfileId === studentFilter || stdName.includes(studentFilter.toLowerCase())
      const matchesCourse = courseFilter === '' || rec.course.id === courseFilter
      const matchesResult = resultFilter === '' || (rec.result || 'PENDING') === resultFilter
      return matchesStd && matchesCourse && matchesResult
    })
  }, [records, studentFilter, courseFilter, resultFilter])

  const getResultBadge = (res: PracticalResult | null) => {
    if (!res) return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400">Pending Review</span>
    switch (res) {
      case 'SATISFACTORY':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle className="h-3 w-3" /> Satisfactory</span>
      case 'NEEDS_REVIEW':
        return <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-500/10 dark:text-orange-400"><AlertTriangle className="h-3 w-3" /> Needs Review</span>
      case 'UNSATISFACTORY':
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-500/10 dark:text-rose-400"><XCircle className="h-3 w-3" /> Fail</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        loading={isActionPending}
      />

      {/* Top actions & filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All Courses / Modules</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </select>

          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All Students</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.studentId} — {s.user?.profile?.firstName || ''} {s.user?.profile?.lastName || ''}</option>
            ))}
          </select>

          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All Results</option>
            <option value="PENDING">Pending Assessment</option>
            <option value="SATISFACTORY">Satisfactory</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="UNSATISFACTORY">Unsatisfactory</option>
          </select>
        </div>

        <button
          onClick={handleCreateClick}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Log Practical Record
        </button>
      </div>

      {/* Main Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Date / Module</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Task Detail</th>
              <th className="px-6 py-4">Result / Cat</th>
              <th className="px-6 py-4 text-center">Signatures</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {filteredRecords.map((rec) => (
              <tr key={rec.id} className="transition hover:bg-slate-50/30 dark:hover:bg-slate-800/30">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {new Date(rec.date).toLocaleDateString()}
                  </div>
                  <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {rec.course.code}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {rec.studentProfile?.user?.profile?.firstName || 'Unknown'} {rec.studentProfile?.user?.profile?.lastName || 'Student'}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                    ID: {rec.studentProfile?.studentId}
                  </div>
                </td>

                <td className="px-6 py-4 max-w-xs">
                  <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                    {rec.description}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 text-xs">
                    {rec.ataChapter && (
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        ATA {rec.ataChapter.code}
                      </span>
                    )}
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 uppercase">
                      {rec.deliveryMethod.replace('_', ' ')}
                    </span>
                  </div>
                </td>

                <td className="whitespace-nowrap px-6 py-4">
                  <div>{getResultBadge(rec.result)}</div>
                  <div className="mt-1 flex items-center gap-1 font-mono text-[10px] font-black text-slate-400">
                    TASK CAT: <span className="text-slate-600 dark:text-slate-300">{rec.taskCategory}</span>
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex gap-2">
                      <span
                        title="Instructor Signature"
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          rec.signedByInstructor
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                        }`}
                      >
                        Ins
                      </span>
                      <span
                        title="Student Signature"
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          rec.signedByStudent
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                        }`}
                      >
                        Std
                      </span>
                    </div>
                  </div>
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {!rec.signedByInstructor ? (
                      <button
                        onClick={() => signRecord(rec.id, !rec.result)}
                        disabled={isActionPending}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Sign
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mr-2">
                        <ShieldCheck className="h-4 w-4" /> Complete
                      </span>
                    )}
                    
                    <button
                      onClick={() => handleEditClick(rec)}
                      title="Edit Record"
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    
                    <button
                      onClick={() => deleteRecord(rec.id)}
                      title="Delete Record"
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center font-medium text-slate-500">
                  No practical assessment records found for current selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Log/Edit Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4 dark:border-slate-700/60">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {editingId ? 'Edit Practical Record' : 'Log New Practical Training Record'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                    Student <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.studentProfileId}
                    onChange={(e) => setFormData({ ...formData, studentProfileId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">-- Select Student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.studentId} — {s.user?.profile?.firstName || ''} {s.user?.profile?.lastName || ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                    Course / Module <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">-- Select Module --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                    Practical category <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {(['P1', 'P2'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, taskCategory: cat })}
                        className={`flex-1 rounded-lg border py-2 text-center text-sm font-bold shadow-sm transition ${
                          formData.taskCategory === cat
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400'
                            : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {cat} Task
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                    ATA Chapter
                  </label>
                  <select
                    value={formData.ataChapterId}
                    onChange={(e) => setFormData({ ...formData, ataChapterId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">-- Select ATA Chapter (Optional) --</option>
                    {ataChapters.map(c => (
                      <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                    Date Conducted <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                    Duration (Minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={15}
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                    Responsible Instructor <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.instructorId}
                    onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">-- Select Instructor --</option>
                    {instructors.map(i => (
                      <option key={i.id} value={i.id}>{i.profile?.firstName || ''} {i.profile?.lastName || ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                    Delivery Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.deliveryMethod}
                    onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value as PracticalDeliveryMethod })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="TASK_PERFORMANCE">Task Performance</option>
                    <option value="DEMONSTRATION">Demonstration</option>
                    <option value="TECHNICAL_DISCUSSION">Technical Discussion</option>
                    <option value="SIMULATION">Simulation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  Task / Manual Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. AMM 24-20-00, Job Card #2024-12"
                  value={formData.taskReference}
                  onChange={(e) => setFormData({ ...formData, taskReference: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  Task Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the practical task, tools used, and objective performed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="border-t border-slate-200/60 pt-4 dark:border-slate-700/60">
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-3">Assessment</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                      Result / Competency
                    </label>
                    <select
                      value={formData.result}
                      onChange={(e) => setFormData({ ...formData, result: e.target.value as PracticalResult })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">-- Leave Unassessed (Pending) --</option>
                      <option value="SATISFACTORY">Satisfactory</option>
                      <option value="NEEDS_REVIEW">Needs Review</option>
                      <option value="UNSATISFACTORY">Unsatisfactory</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                      Instructor Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Good handling of safety wire..."
                      value={formData.assessorNotes}
                      onChange={(e) => setFormData({ ...formData, assessorNotes: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200/60 pt-4 dark:border-slate-700/60 mt-6">
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
                >
                  {isActionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {editingId ? 'Update Practical Task' : 'Save Practical Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
