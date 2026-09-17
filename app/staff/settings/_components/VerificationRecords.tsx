'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react'
import {
  listVerificationsForAdmin,
  revokeVerificationAction,
} from '@/app/staff/settings/_actions/pdf-template-actions'

export interface VerificationRecord {
  id: string
  code: string
  documentType: string
  certificateNo: string | null
  recipientName: string
  issueDate: Date | null
  revokedAt: Date | null
  expiresAt: Date | null
  revokedBy: string | null
  revokeReason: string | null
  generatedBy: string | null
  createdAt: Date | null
}

export default function VerificationRecords() {
  const [records, setRecords] = useState<VerificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [reasons, setReasons] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listVerificationsForAdmin({ limit: 100 })
      setRecords(data.verifications as VerificationRecord[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load verification records'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  const handleReasonChange = (id: string, value: string) => {
    setReasons(prev => ({ ...prev, [id]: value }))
  }

  const handleRevoke = async (record: VerificationRecord) => {
    const reason = reasons[record.id]?.trim()
    if (!reason) {
      toast.error('Please provide a revocation reason')
      return
    }
    setRevokingId(record.id)
    try {
      await revokeVerificationAction(record.code, reason)
      toast.success(`Verification ${record.code} revoked`)
      setReasons(prev => ({ ...prev, [record.id]: '' }))
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke verification')
    } finally {
      setRevokingId(null)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Document Verification Records
        </h3>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
          aria-label="Refresh verification records"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500" role="status" aria-live="polite">
          Loading verification records…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-medium">Failed to load verification records</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={load}
            className="mt-4 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
          No verification records found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Code</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Type</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Recipient</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Issued</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Revoke</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
              {records.map((record) => (
                <tr key={record.id} className={record.revokedAt ? 'opacity-60' : ''}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-mono font-medium text-slate-900 dark:text-slate-100">
                    {record.code}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {record.documentType}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {record.recipientName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {formatDate(record.issueDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {record.revokedAt ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        Revoked
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {!record.revokedAt && (
                      <div className="flex items-center gap-2">
                        <label htmlFor={`reason-${record.id}`} className="sr-only">
                          Revocation reason for {record.code}
                        </label>
                        <input
                          id={`reason-${record.id}`}
                          type="text"
                          value={reasons[record.id] ?? ''}
                          onChange={(e) => handleReasonChange(record.id, e.target.value)}
                          placeholder="Revocation reason"
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <button
                          onClick={() => handleRevoke(record)}
                          disabled={revokingId === record.id || !(reasons[record.id] ?? '').trim()}
                          className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                          aria-label={`Revoke verification ${record.code}`}
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                          {revokingId === record.id ? 'Revoking…' : 'Revoke'}
                        </button>
                      </div>
                    )}
                    {record.revokedAt && record.revokeReason && (
                      <div className="flex items-center gap-1 text-xs text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        {record.revokeReason}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
