'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  FileUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ParsedStudent {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phone?: string
  enrollmentType?: string
}

interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

export default function ImportStudentsPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

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
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

      const data: ParsedStudent[] = []

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const values = lines[i].split(',').map((v) => v.trim())
        const student: any = {}

        headers.forEach((header, index) => {
          // Map common header names to our fields
          if (header.includes('first')) student.firstName = values[index]
          else if (header.includes('last')) student.lastName = values[index]
          else if (header.includes('middle')) student.middleName = values[index]
          else if (header.includes('email')) student.email = values[index]
          else if (header.includes('phone')) student.phone = values[index]
          else if (header.includes('type') || header.includes('enrollment'))
            student.enrollmentType = values[index]
        })

        if (student.firstName && student.lastName && student.email) {
          data.push(student)
        }
      }
      setParsedData(data)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return

    setIsUploading(true)
    try {
      const res = await fetch('/api/staff/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: parsedData }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Import failed')

      setImportResult(data)
      if (data.created > 0) {
        toast.success(`Successfully imported ${data.created} students`)
        router.refresh()
      } else if (data.errors.length > 0) {
        toast.warning('Some records could not be imported')
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link
          href="/staff/users?tab=students"
          className="mb-4 inline-flex items-center text-sm font-bold text-slate-400 transition-colors hover:text-[#002a5c]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Students
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Import Students</h1>
        <p className="text-slate-500 dark:text-slate-400">Bulk upload student records via CSV</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                File should contain headers: First Name, Last Name, Email, Phone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-12 transition-colors hover:bg-slate-100">
                <FileUp className="mb-4 h-10 w-10 text-slate-400" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="rounded-md bg-[#002a5c] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#002a5c]/90">
                    Select CSV File
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {file && (
                  <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">Selected: {file.name}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          {importResult && (
            <Card
              className={
                importResult.errors.length > 0
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-emerald-200 bg-emerald-50'
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.errors.length > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  )}
                  Import Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Created</p>
                    <p className="text-2xl font-bold text-emerald-600">{importResult.created}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Skipped/Errors</p>
                    <p className="text-2xl font-bold text-amber-600">{importResult.skipped}</p>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-md border border-amber-200 bg-white dark:bg-slate-900 p-4">
                    <p className="mb-2 text-xs font-bold uppercase text-slate-400">Error Log</p>
                    <ul className="space-y-1">
                      {importResult.errors.map((err, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-red-600">
                          <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Data ({parsedData.length} records)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 5).map((student, i) => (
                        <TableRow key={i}>
                          <TableCell>{student.firstName}</TableCell>
                          <TableCell>{student.lastName}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.phone || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {parsedData.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center italic text-slate-400">
                            ... and {parsedData.length - 5} more
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleImport} disabled={isUploading || importResult !== null}>
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Import Students
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <p>
                Upload a CSV file with the following columns. The order does not matter as long as
                headers match roughly.
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  <strong>First Name</strong> (Required)
                </li>
                <li>
                  <strong>Last Name</strong> (Required)
                </li>
                <li>
                  <strong>Email</strong> (Required, Unique)
                </li>
                <li>
                  <strong>Phone</strong> (Optional)
                </li>
                <li>
                  <strong>Middle Name</strong> (Optional)
                </li>
                <li>
                  <strong>Enrollment Type</strong> (Optional)
                </li>
              </ul>
              <div className="rounded-md bg-slate-100 p-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                First Name, Last Name, Email, Phone
                <br />
                John, Doe, john@example.com, 1234567890
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
