'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Copy,
  Plus,
  Trash2,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface CompletedModule {
  moduleCode: string
  result: 'pass' | 'fail'
  institution?: string
  sourceNotes?: string
}

interface SemesterEnrollment {
  academicYearName: string
  semesterName: string
  yearNumber: number
  semesterNumber: number
  courseCodes: string[]
  status?: string
}

interface ImportStudent {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phone?: string
  enrollmentType?: string
  programmeChoice?: string
  academyEmail?: string
  walletCreditEur?: number
  walletNotes?: string
  completedModules?: CompletedModule[]
  examHistory?: any[]
  entitlements?: any[]
  plannedBookings?: any[]
  notes?: string
  selectedLicenseCategories?: string[]
  fundingSource?: string
  enrollmentStatus?: string
  currentYearNumber?: number
  currentSemesterNumber?: number
  semesterEnrollments?: SemesterEnrollment[]
}

interface CredentialRow {
  firstName: string
  lastName: string
  personalEmail: string
  academyEmail: string
  temporaryPassword: string
  walletBalanceEur: number
  studentId: string
  enrollmentType: string
  fundingSource: string
  enrollmentStatus: string
  notes: string
}

interface ImportResult {
  migrationRef: string
  summary: {
    total: number
    created: number
    updated: number
    skipped: number
    errors: number
  }
  credentials: CredentialRow[]
  errors: string[]
}

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const MODULE_CODES = [
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M7A', 'M8', 'M9', 'M10',
  'M11', 'M11A', 'M11B', 'M11C', 'M12', 'M13', 'M14',
]

const PROGRAMME_CHOICES = [
  { value: 'EXAM_ONLY', label: 'Exam Only' },
  { value: 'MODULAR', label: 'Modular' },
  { value: 'FULL_TIME_4YEAR', label: 'Full-Time 4 Year' },
  { value: 'FULL_TIME_2YEAR', label: 'Full-Time 2 Year' },
  { value: 'MILITARY_1YEAR', label: 'Military 1 Year' },
]

const ENROLLMENT_TYPES = [
  { value: 'EXAM_ONLY', label: 'Exam Only' },
  { value: 'MODULAR', label: 'Modular' },
  { value: 'FULL_TIME', label: 'Full-Time' },
  { value: 'SHORT_COURSE', label: 'Short Course' },
]

// ---------------------------------------------------------------------------
// PAGE COMPONENT
// ---------------------------------------------------------------------------

export default function ImportStudentsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'csv' | 'manual'>('csv')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ImportStudent[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showPasswords, setShowPasswords] = useState(false)
  const [sendingCredentials, setSendingCredentials] = useState<string | null>(null)

  // Manual entry state
  const [manualStudents, setManualStudents] = useState<ImportStudent[]>([createEmptyStudent()])
  const [expandedStudent, setExpandedStudent] = useState<number | null>(0)

  // ---- CSV PARSING ----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseCSV(selectedFile)
      setImportResult(null)
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))

      const data: ImportStudent[] = []

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const values = parseCSVLine(lines[i])
        const student: any = {}

        headers.forEach((header, index) => {
          const val = values[index]?.trim()
          if (!val) return

          if (header.includes('first') && header.includes('name')) student.firstName = val
          else if (header.includes('last') && header.includes('name')) student.lastName = val
          else if (header.includes('middle')) student.middleName = val
          else if (header.includes('personal') && header.includes('email')) student.email = val
          else if (header.includes('academy') && header.includes('email')) student.academyEmail = val
          else if (header === 'email') student.email = val
          else if (header.includes('phone')) student.phone = val
          else if (header.includes('enrollment') && header.includes('type')) student.enrollmentType = val
          else if (header.includes('programme')) student.programmeChoice = val
          else if (header.includes('wallet') && header.includes('credit')) student.walletCreditEur = parseFloat(val) || 0
          else if (header.includes('wallet') && header.includes('note')) student.walletNotes = val
          else if (header.includes('notes') && !header.includes('wallet')) student.notes = val
          else if (header.includes('completed') && header.includes('module')) {
            try { student.completedModules = JSON.parse(val) } catch { /* skip */ }
          }
          else if (header.includes('exam') && header.includes('history')) {
            try { student.examHistory = JSON.parse(val) } catch { /* skip */ }
          }
          else if (header.includes('entitlement')) {
            try { student.entitlements = JSON.parse(val) } catch { /* skip */ }
          }
          else if (header.includes('planned') && header.includes('booking')) {
            try { student.plannedBookings = JSON.parse(val) } catch { /* skip */ }
          }
          else if (header.includes('license') || header.includes('licence')) {
            try { student.selectedLicenseCategories = JSON.parse(val) } catch {
              student.selectedLicenseCategories = val.split(';').map((s: string) => s.trim()).filter(Boolean)
            }
          }
          else if (header.includes('funding') && header.includes('source') || header === 'funding') {
            student.fundingSource = val.toUpperCase()
          }
          else if (header.includes('enrollment') && header.includes('status') || header === 'status') {
            student.enrollmentStatus = val.toUpperCase()
          }
          else if (header.includes('current') && header.includes('year') || header === 'current_year') {
            student.currentYearNumber = parseInt(val) || undefined
          }
          else if (header.includes('current') && header.includes('semester') || header === 'current_semester') {
            student.currentSemesterNumber = parseInt(val) || undefined
          }
          else if (header.match(/year\d+_sem\d+_courses/)) {
            // Parse semester enrollment columns like year1_sem1_courses, year2_sem2_courses
            const match = header.match(/year(\d+)_sem(\d+)_courses/)
            if (match) {
              const yearNum = parseInt(match[1])
              const semNum = parseInt(match[2])
              const courseCodes = val.split(/[,;]/).map((c: string) => c.trim()).filter(Boolean)
              if (courseCodes.length > 0) {
                if (!student.semesterEnrollments) student.semesterEnrollments = []
                student.semesterEnrollments.push({
                  academicYearName: '', // Will be set from dedicated columns or defaults
                  semesterName: `Semester ${semNum}`,
                  yearNumber: yearNum,
                  semesterNumber: semNum,
                  courseCodes,
                  status: 'COMPLETED',
                })
              }
            }
          }
          else if (header.match(/year\d+_name/)) {
            // Map academic year names: year1_name -> "2024/2025"
            const match = header.match(/year(\d+)_name/)
            if (match && val) {
              const yearNum = parseInt(match[1])
              if (!student.semesterEnrollments) student.semesterEnrollments = []
              student.semesterEnrollments.forEach((se: SemesterEnrollment) => {
                if (se.yearNumber === yearNum && !se.academicYearName) {
                  se.academicYearName = val
                }
              })
            }
          }
        })

        if (student.firstName && student.lastName && student.email) {
          data.push(student)
        }
      }
      setParsedData(data)
    }
    reader.readAsText(file)
  }

  // ---- IMPORT ----
  const handleImport = async (students: ImportStudent[]) => {
    if (students.length === 0) return

    setIsUploading(true)
    try {
      const res = await fetch('/api/staff/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')

      const result = data.data || data
      setImportResult(result)

      if (result.summary?.created > 0 || result.summary?.updated > 0) {
        toast.success(`Imported: ${result.summary.created} created, ${result.summary.updated} updated`)
        router.refresh()
      } else if (result.errors?.length > 0) {
        toast.warning('Some records could not be imported')
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  // ---- CSV EXPORT ----
  const exportCredentials = () => {
    if (!importResult?.credentials?.length) return

    const csvHeader = 'First Name,Last Name,Personal Email,Academy Email,Temporary Password,Wallet EUR,Student ID,Enrollment Type,Funding Source,Status,Notes'
    const csvRows = importResult.credentials.map((c) =>
      `"${c.firstName}","${c.lastName}","${c.personalEmail}","${c.academyEmail}","${c.temporaryPassword}",${c.walletBalanceEur},"${c.studentId}","${c.enrollmentType}","${c.fundingSource || ''}","${c.enrollmentStatus || ''}","${(c.notes || '').replace(/"/g, '""')}"`
    )
    const csv = [csvHeader, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import-credentials-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---- MANUAL FORM HELPERS ----
  const addManualStudent = () => {
    setManualStudents((prev) => [...prev, createEmptyStudent()])
    setExpandedStudent(manualStudents.length)
  }

  const removeManualStudent = (index: number) => {
    setManualStudents((prev) => prev.filter((_, i) => i !== index))
    setExpandedStudent(null)
  }

  const updateManualStudent = (index: number, field: string, value: any) => {
    setManualStudents((prev) => {
      const updated = [...prev]
      ;(updated[index] as any)[field] = value
      return updated
    })
  }

  const addCompletedModule = (studentIndex: number) => {
    setManualStudents((prev) => {
      const updated = [...prev]
      updated[studentIndex] = {
        ...updated[studentIndex],
        completedModules: [
          ...(updated[studentIndex].completedModules || []),
          { moduleCode: '', result: 'pass' as const },
        ],
      }
      return updated
    })
  }

  const updateCompletedModule = (studentIndex: number, modIndex: number, field: string, value: any) => {
    setManualStudents((prev) => {
      const updated = [...prev]
      const mods = [...(updated[studentIndex].completedModules || [])]
      ;(mods[modIndex] as any)[field] = value
      updated[studentIndex] = { ...updated[studentIndex], completedModules: mods }
      return updated
    })
  }

  const removeCompletedModule = (studentIndex: number, modIndex: number) => {
    setManualStudents((prev) => {
      const updated = [...prev]
      const mods = [...(updated[studentIndex].completedModules || [])]
      mods.splice(modIndex, 1)
      updated[studentIndex] = { ...updated[studentIndex], completedModules: mods }
      return updated
    })
  }

  // ---- RENDER ----
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          href="/staff/users?tab=students"
          className="mb-4 inline-flex items-center text-sm font-bold text-slate-400 transition-colors hover:text-aerojet-blue"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Students
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Import Students
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Bulk upload or manually add students with wallet credits, completed modules, exam history, and pathway assignment
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'csv' | 'manual')}>
        <TabsList className="mb-6">
          <TabsTrigger value="csv">
            <FileUp className="mr-2 h-4 w-4" />
            CSV Upload
          </TabsTrigger>
          <TabsTrigger value="manual">
            <UserPlus className="mr-2 h-4 w-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        {/* ====================== CSV TAB ====================== */}
        <TabsContent value="csv">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload CSV File</CardTitle>
                  <CardDescription>
                    Supports wallet credits, completed modules, exam history, and pathway assignment.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-12 transition-colors hover:bg-slate-100">
                    <FileUp className="mb-4 h-10 w-10 text-slate-400" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="rounded-md bg-aerojet-blue px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-aerojet-blue/90">
                        Select CSV File
                      </span>
                      <input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                    </label>
                    {file && <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">Selected: {file.name}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* CSV Preview */}
              {parsedData.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Preview ({parsedData.length} records)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Pathway</TableHead>
                            <TableHead>Wallet EUR</TableHead>
                            <TableHead>Completed</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.slice(0, 10).map((s, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">
                                {s.firstName} {s.middleName || ''} {s.lastName}
                              </TableCell>
                              <TableCell className="text-xs">{s.email}</TableCell>
                              <TableCell>
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                  {s.programmeChoice || s.enrollmentType || 'EXAM_ONLY'}
                                </span>
                              </TableCell>
                              <TableCell>{s.walletCreditEur ? `€${s.walletCreditEur}` : '-'}</TableCell>
                              <TableCell>{s.completedModules?.length || 0} modules</TableCell>
                              <TableCell className="max-w-32 truncate text-xs text-slate-500">{s.notes || '-'}</TableCell>
                            </TableRow>
                          ))}
                          {parsedData.length > 10 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center italic text-slate-400">
                                ... and {parsedData.length - 10} more
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button onClick={() => handleImport(parsedData)} disabled={isUploading || importResult !== null}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import {parsedData.length} Students
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Instructions Sidebar */}
            <div className="space-y-6">
              <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    CSV Column Reference
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Required:</p>
                    <ul className="list-disc space-y-0.5 pl-4 text-xs">
                      <li><strong>First Name</strong></li>
                      <li><strong>Last Name</strong></li>
                      <li><strong>Email</strong> (personal, unique)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Optional:</p>
                    <ul className="list-disc space-y-0.5 pl-4 text-xs">
                      <li>Middle Name, Phone, Academy Email</li>
                      <li>Enrollment Type, Programme Choice</li>
                      <li>Wallet Credit EUR, Wallet Notes</li>
                      <li>License Categories (B1.1;B2)</li>
                      <li>Completed Modules JSON</li>
                      <li>Exam History JSON, Entitlements JSON</li>
                      <li>Planned Bookings JSON, Notes</li>
                    </ul>
                  </div>
                  <div className="rounded-md bg-slate-100 dark:bg-slate-900 p-3 font-mono text-xs">
                    First Name,Last Name,Email,Wallet Credit EUR
                    <br />
                    John,Doe,john@mail.com,670
                  </div>
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-xs">
                    <p className="font-semibold text-amber-700 dark:text-amber-400">Idempotent</p>
                    <p className="text-amber-600 dark:text-amber-500">
                      Safe to re-run. Existing users are updated. Wallet credits applied once per batch.
                    </p>
                  </div>
                  <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-xs">
                    <p className="font-semibold text-blue-700 dark:text-blue-400">Transfer Students</p>
                    <p className="text-blue-600 dark:text-blue-500">
                      For students with modules completed elsewhere, add completed modules via CSV or Manual Entry tab.
                      They can be assigned any pathway.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ====================== MANUAL ENTRY TAB ====================== */}
        <TabsContent value="manual">
          <div className="space-y-4">
            {manualStudents.map((student, idx) => (
              <Card key={idx} className="overflow-hidden">
                {/* Collapsed Header */}
                <div
                  className="flex cursor-pointer items-center justify-between border-b bg-slate-50 dark:bg-slate-800/50 px-6 py-3"
                  onClick={() => setExpandedStudent(expandedStudent === idx ? null : idx)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-aerojet-blue text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {student.firstName && student.lastName
                        ? `${student.firstName} ${student.lastName}`
                        : `Student ${idx + 1}`}
                    </span>
                    {student.email && <span className="text-xs text-slate-400">{student.email}</span>}
                    {student.programmeChoice && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {student.programmeChoice}
                      </span>
                    )}
                    {student.fundingSource === 'SCHOLARSHIP' && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        Scholarship
                      </span>
                    )}
                    {student.enrollmentStatus && student.enrollmentStatus !== 'ACTIVE' && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {student.enrollmentStatus}
                      </span>
                    )}
                    {(student.semesterEnrollments?.length ?? 0) > 0 && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                        {student.semesterEnrollments!.length} semesters
                      </span>
                    )}
                    {(student.walletCreditEur ?? 0) > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        €{student.walletCreditEur}
                      </span>
                    )}
                    {(student.completedModules?.length ?? 0) > 0 && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        {student.completedModules!.length} modules
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {manualStudents.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeManualStudent(idx) }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                    {expandedStudent === idx ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Form */}
                {expandedStudent === idx && (
                  <CardContent className="space-y-6 pt-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Basic Information</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <Label>First Name *</Label>
                          <Input value={student.firstName} onChange={(e) => updateManualStudent(idx, 'firstName', e.target.value)} placeholder="e.g. David" />
                        </div>
                        <div>
                          <Label>Middle Name</Label>
                          <Input value={student.middleName || ''} onChange={(e) => updateManualStudent(idx, 'middleName', e.target.value)} placeholder="Optional" />
                        </div>
                        <div>
                          <Label>Last Name *</Label>
                          <Input value={student.lastName} onChange={(e) => updateManualStudent(idx, 'lastName', e.target.value)} placeholder="e.g. Archer" />
                        </div>
                        <div>
                          <Label>Personal Email *</Label>
                          <Input type="email" value={student.email} onChange={(e) => updateManualStudent(idx, 'email', e.target.value)} placeholder="student@gmail.com" />
                        </div>
                        <div>
                          <Label>Academy Email</Label>
                          <Input value={student.academyEmail || ''} onChange={(e) => updateManualStudent(idx, 'academyEmail', e.target.value)} placeholder="Auto-generated if blank" />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input value={student.phone || ''} onChange={(e) => updateManualStudent(idx, 'phone', e.target.value)} placeholder="Optional" />
                        </div>
                      </div>
                    </div>

                    {/* Pathway */}
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Pathway & Programme</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <Label>Programme Choice</Label>
                          <Select
                            value={student.programmeChoice || ''}
                            onValueChange={(v) => {
                              updateManualStudent(idx, 'programmeChoice', v)
                              const etMap: Record<string, string> = {
                                FULL_TIME_4YEAR: 'FULL_TIME', FULL_TIME_2YEAR: 'FULL_TIME',
                                MILITARY_1YEAR: 'FULL_TIME', MODULAR: 'MODULAR', EXAM_ONLY: 'EXAM_ONLY',
                              }
                              updateManualStudent(idx, 'enrollmentType', etMap[v] || 'MODULAR')
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Select programme" /></SelectTrigger>
                            <SelectContent>
                              {PROGRAMME_CHOICES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Enrollment Type</Label>
                          <Select
                            value={student.enrollmentType || ''}
                            onValueChange={(v) => updateManualStudent(idx, 'enrollmentType', v)}
                          >
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              {ENROLLMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>License Categories</Label>
                          <Input
                            value={(student.selectedLicenseCategories || []).join(', ')}
                            onChange={(e) => updateManualStudent(idx, 'selectedLicenseCategories',
                              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            )}
                            placeholder="e.g. B1.1, B2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Scholarship & Status */}
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Scholarship & Status</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <Label>Funding Source</Label>
                          <Select
                            value={student.fundingSource || 'SCHOLARSHIP'}
                            onValueChange={(v) => updateManualStudent(idx, 'fundingSource', v)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SELF_FUNDED">Self Funded</SelectItem>
                              <SelectItem value="SCHOLARSHIP">Scholarship</SelectItem>
                              <SelectItem value="SPONSORED">Sponsored</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Enrollment Status</Label>
                          <Select
                            value={student.enrollmentStatus || 'ACTIVE'}
                            onValueChange={(v) => updateManualStudent(idx, 'enrollmentStatus', v)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="ENROLLED">Enrolled</SelectItem>
                              <SelectItem value="DEFERRED">Deferred (Paused)</SelectItem>
                              <SelectItem value="SUSPENDED">Suspended</SelectItem>
                              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Current Year</Label>
                          <Select
                            value={String(student.currentYearNumber || 1)}
                            onValueChange={(v) => updateManualStudent(idx, 'currentYearNumber', parseInt(v))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Current Semester</Label>
                          <Select
                            value={String(student.currentSemesterNumber || 1)}
                            onValueChange={(v) => updateManualStudent(idx, 'currentSemesterNumber', parseInt(v))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Semester 1</SelectItem>
                              <SelectItem value="2">Semester 2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Semester Enrollments */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                          Semester Enrollments
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const sems = [...(student.semesterEnrollments || [])]
                            const nextYear = sems.length > 0 ? sems[sems.length - 1].yearNumber : 1
                            const nextSem = sems.length > 0 ? (sems[sems.length - 1].semesterNumber === 1 ? 2 : 1) : 1
                            const yearNum = nextSem === 1 && sems.length > 0 ? nextYear + 1 : nextYear
                            sems.push({
                              academicYearName: '',
                              semesterName: `Semester ${nextSem}`,
                              yearNumber: yearNum,
                              semesterNumber: nextSem,
                              courseCodes: [],
                              status: 'COMPLETED',
                            })
                            updateManualStudent(idx, 'semesterEnrollments', sems)
                          }}
                        >
                          <Plus className="mr-1 h-3 w-3" /> Add Semester
                        </Button>
                      </div>
                      {(student.semesterEnrollments || []).length === 0 && (
                        <p className="text-xs italic text-slate-400">
                          No semester enrollments added. Add semesters to track course history.
                        </p>
                      )}
                      {(student.semesterEnrollments || []).map((sem, semIdx) => (
                        <div key={semIdx} className="mb-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                              Year {sem.yearNumber} - Semester {sem.semesterNumber}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const sems = [...(student.semesterEnrollments || [])]
                                sems.splice(semIdx, 1)
                                updateManualStudent(idx, 'semesterEnrollments', sems)
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <Label className="text-xs">Academic Year</Label>
                              <Input
                                value={sem.academicYearName}
                                onChange={(e) => {
                                  const sems = [...(student.semesterEnrollments || [])]
                                  sems[semIdx] = { ...sems[semIdx], academicYearName: e.target.value }
                                  updateManualStudent(idx, 'semesterEnrollments', sems)
                                }}
                                placeholder="e.g. 2024/2025"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Semester</Label>
                              <Select
                                value={`${sem.yearNumber}-${sem.semesterNumber}`}
                                onValueChange={(v) => {
                                  const [y, s] = v.split('-').map(Number)
                                  const sems = [...(student.semesterEnrollments || [])]
                                  sems[semIdx] = { ...sems[semIdx], yearNumber: y, semesterNumber: s, semesterName: `Semester ${s}` }
                                  updateManualStudent(idx, 'semesterEnrollments', sems)
                                }}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4].flatMap((y) =>
                                    [1, 2].map((s) => (
                                      <SelectItem key={`${y}-${s}`} value={`${y}-${s}`}>Year {y} Sem {s}</SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Course Codes</Label>
                              <Input
                                value={sem.courseCodes.join(', ')}
                                onChange={(e) => {
                                  const sems = [...(student.semesterEnrollments || [])]
                                  sems[semIdx] = {
                                    ...sems[semIdx],
                                    courseCodes: e.target.value.split(/[,;]/).map((c) => c.trim()).filter(Boolean),
                                  }
                                  updateManualStudent(idx, 'semesterEnrollments', sems)
                                }}
                                placeholder="M1, M2, M3, M4"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Status</Label>
                              <Select
                                value={sem.status || 'COMPLETED'}
                                onValueChange={(v) => {
                                  const sems = [...(student.semesterEnrollments || [])]
                                  sems[semIdx] = { ...sems[semIdx], status: v }
                                  updateManualStudent(idx, 'semesterEnrollments', sems)
                                }}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="COMPLETED">Completed</SelectItem>
                                  <SelectItem value="ACTIVE">Active</SelectItem>
                                  <SelectItem value="FAILED">Failed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Wallet */}
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Wallet Credit</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <Label>Initial Wallet Credit (EUR)</Label>
                          <Input
                            type="number" min="0" step="10"
                            value={student.walletCreditEur || ''}
                            onChange={(e) => updateManualStudent(idx, 'walletCreditEur', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label>Wallet Notes</Label>
                          <Input
                            value={student.walletNotes || ''}
                            onChange={(e) => updateManualStudent(idx, 'walletNotes', e.target.value)}
                            placeholder="Source of funds, admin notes"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Completed Modules */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                          Completed Modules (from other institutions)
                        </h3>
                        <Button variant="outline" size="sm" onClick={() => addCompletedModule(idx)}>
                          <Plus className="mr-1 h-3 w-3" /> Add Module
                        </Button>
                      </div>
                      {(student.completedModules || []).length === 0 && (
                        <p className="text-xs italic text-slate-400">
                          No completed modules yet. Add modules passed at other institutions to credit them here.
                        </p>
                      )}
                      {(student.completedModules || []).map((mod, modIdx) => (
                        <div key={modIdx} className="mb-2 flex items-end gap-3 rounded-md border bg-slate-50 dark:bg-slate-800/50 p-3">
                          <div className="w-32">
                            <Label className="text-xs">Module</Label>
                            <Select value={mod.moduleCode} onValueChange={(v) => updateCompletedModule(idx, modIdx, 'moduleCode', v)}>
                              <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
                              <SelectContent>
                                {MODULE_CODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-28">
                            <Label className="text-xs">Result</Label>
                            <Select value={mod.result} onValueChange={(v) => updateCompletedModule(idx, modIdx, 'result', v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pass">Pass</SelectItem>
                                <SelectItem value="fail">Fail</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Institution</Label>
                            <Input value={mod.institution || ''} onChange={(e) => updateCompletedModule(idx, modIdx, 'institution', e.target.value)} placeholder="Where completed" />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Notes</Label>
                            <Input value={mod.sourceNotes || ''} onChange={(e) => updateCompletedModule(idx, modIdx, 'sourceNotes', e.target.value)} placeholder="Optional" />
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeCompletedModule(idx, modIdx)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    <div>
                      <Label>Admin Notes</Label>
                      <Textarea
                        value={student.notes || ''}
                        onChange={(e) => updateManualStudent(idx, 'notes', e.target.value)}
                        placeholder="Any additional notes about this student"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={addManualStudent}>
                <Plus className="mr-2 h-4 w-4" /> Add Another Student
              </Button>
              <Button
                onClick={() => handleImport(manualStudents.filter((s) => s.firstName && s.lastName && s.email))}
                disabled={isUploading || !manualStudents.some((s) => s.firstName && s.lastName && s.email)}
              >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {manualStudents.filter((s) => s.firstName && s.lastName && s.email).length} Student{manualStudents.filter((s) => s.firstName && s.lastName && s.email).length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ====================== IMPORT RESULTS ====================== */}
      {importResult && (
        <div className="mt-8 space-y-6">
          {/* Summary Card */}
          <Card className={
            (importResult.errors?.length || 0) > 0
              ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
              : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
          }>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(importResult.errors?.length || 0) > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                )}
                Import Summary
                {importResult.migrationRef && (
                  <span className="ml-auto font-mono text-xs font-normal text-slate-400">
                    Ref: {importResult.migrationRef}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">Created</p>
                  <p className="text-2xl font-bold text-emerald-600">{importResult.summary?.created || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Updated</p>
                  <p className="text-2xl font-bold text-blue-600">{importResult.summary?.updated || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Skipped/Errors</p>
                  <p className="text-2xl font-bold text-amber-600">{importResult.summary?.skipped || 0}</p>
                </div>
              </div>
              {(importResult.errors?.length || 0) > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-md border border-amber-200 bg-white dark:bg-slate-900 p-4">
                  <p className="mb-2 text-xs font-bold uppercase text-slate-400">Error Log</p>
                  <ul className="space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-red-600">
                        <XCircle className="mt-0.5 h-3 w-3 shrink-0" /> {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credentials Table */}
          {(importResult.credentials?.length || 0) > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Credentials</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowPasswords(!showPasswords)}>
                      {showPasswords ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                      {showPasswords ? 'Hide' : 'Show'} Passwords
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportCredentials}>
                      <Download className="mr-1 h-4 w-4" /> Export CSV
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Students must change their password on first login. Share credentials securely or use the send button.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Academy Email</TableHead>
                        <TableHead>Temp Password</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.credentials.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {c.firstName} {c.lastName}
                            <br />
                            <span className="text-xs text-slate-400">{c.personalEmail}</span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{c.studentId}</TableCell>
                          <TableCell className="text-xs">{c.academyEmail}</TableCell>
                          <TableCell>
                            {showPasswords ? (
                              <span className="font-mono text-xs">{c.temporaryPassword}</span>
                            ) : (
                              <span className="text-xs text-slate-400">••••••••</span>
                            )}
                            <Button
                              variant="ghost" size="sm" className="ml-1 h-6 w-6 p-0"
                              onClick={() => { navigator.clipboard.writeText(c.temporaryPassword); toast.success('Password copied') }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TableCell>
                          <TableCell>€{c.walletBalanceEur}</TableCell>
                          <TableCell>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              {c.enrollmentType}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-xs" title="Send credentials email (uses existing resend-credentials endpoint)">
                              <Send className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function createEmptyStudent(): ImportStudent {
  return {
    firstName: '',
    lastName: '',
    email: '',
    programmeChoice: 'FULL_TIME_4YEAR',
    enrollmentType: 'FULL_TIME',
    fundingSource: 'SCHOLARSHIP',
    enrollmentStatus: 'ACTIVE',
    currentYearNumber: 1,
    currentSemesterNumber: 1,
    walletCreditEur: 0,
    completedModules: [],
    semesterEnrollments: [],
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}
