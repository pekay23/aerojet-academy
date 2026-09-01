'use client'

import { useState } from 'react'
import { Calendar, FileText, IdCard, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'

const WINDOW_OPTIONS = [30, 60, 90, 180, 365]

interface Doc {
  id: string
  type: string
  title: string
  fileUrl: string
  storageProvider: string
  version: number
  status: string
  expiresAt: string | null
  user: {
    email: string
    profile: { firstName: string; lastName: string } | null
    studentProfile: { studentId: string } | null
  }
}

interface License {
  id: string
  validFrom: string | null
  expiresAt: string | null
  ratingClass: string | null
  validityPeriodMonths: number | null
  issuedAt: string | null
  issuedBy: string | null
  licenseCategory: { code: string; name: string } | null
  studentProfile: {
    studentId: string
    user: {
      email: string
      profile: { firstName: string; lastName: string } | null
    }
  }
}

interface Props {
  documents: Doc[]
  licenses: License[]
  windowDays: number
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function urgencyBadge(days: number | null) {
  if (days === null) return { label: 'Unknown', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' }
  if (days < 0) return { label: 'Expired', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  if (days <= 14) return { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  if (days <= 30) return { label: 'Urgent', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
  if (days <= 60) return { label: 'Soon', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
  return { label: 'Upcoming', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
}

export default function ExpiringDocumentsClient({ documents, licenses, windowDays }: Props) {
  const [tab, setTab] = useState<'documents' | 'licenses'>('documents')
  const [window, setWindow] = useState(windowDays)

  const filteredDocs = documents.filter((d) => {
    if (!d.expiresAt) return false
    const days = daysUntil(d.expiresAt)
    return days !== null && days <= window
  })

  const filteredLicenses = licenses.filter((l) => {
    if (!l.expiresAt) return false
    const days = daysUntil(l.expiresAt)
    return days !== null && days <= window
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant={tab === 'documents' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('documents')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Documents ({filteredDocs.length})
          </Button>
          <Button
            variant={tab === 'licenses' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('licenses')}
          >
            <IdCard className="mr-2 h-4 w-4" />
            Licenses ({filteredLicenses.length})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <Select value={String(window)} onValueChange={(v) => setWindow(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Window" />
            </SelectTrigger>
            <SelectContent>
              {WINDOW_OPTIONS.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  {w} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {tab === 'documents' && (
        <div className="rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          {filteredDocs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No documents expiring within {window} days.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => {
                  const days = daysUntil(doc.expiresAt)
                  const badge = urgencyBadge(days)
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {doc.user.profile
                              ? `${doc.user.profile.firstName} ${doc.user.profile.lastName}`
                              : doc.user.email}
                          </p>
                          <p className="text-xs text-slate-500">{doc.user.studentProfile?.studentId || doc.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium">{doc.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : '—'}</span>
                          {days !== null && (
                            <span className={cn('text-xs font-bold', days < 0 ? 'text-red-600' : 'text-slate-500')}>
                              ({days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn('rounded-full px-2 py-1 text-[10px] font-black', badge.className)}>
                          {badge.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => globalThis.open(doc.fileUrl, '_blank')}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {tab === 'licenses' && (
        <div className="rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          {filteredLicenses.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No licenses expiring within {window} days.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Rating Class</TableHead>
                  <TableHead>Valid From</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((lic) => {
                  const days = daysUntil(lic.expiresAt)
                  const badge = urgencyBadge(days)
                  return (
                    <TableRow key={lic.id}>
                      <TableCell>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {lic.studentProfile.user.profile
                              ? `${lic.studentProfile.user.profile.firstName} ${lic.studentProfile.user.profile.lastName}`
                              : lic.studentProfile.user.email}
                          </p>
                          <p className="text-xs text-slate-500">{lic.studentProfile.studentId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{lic.licenseCategory?.name}</p>
                          <p className="text-xs text-slate-500">{lic.licenseCategory?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lic.ratingClass || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{lic.validFrom ? new Date(lic.validFrom).toLocaleDateString() : '—'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : '—'}</span>
                          {days !== null && (
                            <span className={cn('text-xs font-bold', days < 0 ? 'text-red-600' : 'text-slate-500')}>
                              ({days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn('rounded-full px-2 py-1 text-[10px] font-black', badge.className)}>
                          {badge.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}
