'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Clock
} from 'lucide-react'
import { bulkUpdatePaymentStatus } from '../actions'
import { toast } from 'sonner'
import Link from 'next/link'
import BulkActionsBar from './BulkActionsBar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import TablePagination from './TablePagination'

interface PendingTopup {
  id: string
  amount: any
  currency: string
  paymentCurrency: string | null
  originalAmount: any | null
  createdAt: Date
  proofUrl: string | null
  user: {
    email: string
    profile: { firstName: string; lastName: string } | null
  }
}

interface PendingTopupsTableProps {
  requests: PendingTopup[]
}

export default function PendingTopupsTable({ requests }: PendingTopupsTableProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const total = requests.length
  const paged = requests.slice((page - 1) * perPage, page * perPage)

  const toggleAll = () => {
    if (selectedIds.length === paged.length && paged.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(paged.map((r) => r.id))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="w-12 px-6">
                <button
                  onClick={toggleAll}
                  className="text-slate-400 hover:text-aerojet-blue transition-colors"
                >
                  {selectedIds.length === paged.length && paged.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-aerojet-blue" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead>Requested</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  No pending top-up requests.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((req) => {
                const userName = req.user.profile
                  ? `${req.user.profile.firstName} ${req.user.profile.lastName}`
                  : req.user.email

                return (
                  <TableRow key={req.id} className={selectedIds.includes(req.id) ? 'bg-aerojet-blue/5' : ''}>
                    <TableCell className="px-6">
                      <button
                        onClick={() => toggleOne(req.id)}
                        className="text-slate-300 transition-colors hover:text-aerojet-blue"
                      >
                        {selectedIds.includes(req.id) ? (
                          <CheckSquare className="h-4 w-4 text-aerojet-blue" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {userName}
                        </span>
                        <span className="text-xs text-slate-500">{req.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {req.currency} {Number(req.amount).toFixed(2)}
                        </span>
                        {req.paymentCurrency && req.paymentCurrency !== req.currency && (
                          <span className="text-[10px] font-medium text-slate-400">
                            (Original: {req.paymentCurrency}{' '}
                            {Number(req.originalAmount || 0).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {req.proofUrl ? (
                        <Link
                          href={req.proofUrl}
                          target="_blank"
                          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          View Receipt <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">No proof</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {format(new Date(req.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={setPerPage} />
      </div>

      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        actions={[
          {
            label: 'Approve',
            icon: CheckCircle2,
            variant: 'success',
            confirmTitle: 'Approve Top-ups',
            confirmMessage: `Are you sure you want to approve ${selectedIds.length} selected top-up requests? This will credit the students' wallets.`,
            onClick: async (ids) => {
              const res = await bulkUpdatePaymentStatus(ids, 'APPROVED')
              if (res.success) {
                toast.success(`Approved ${ids.length} top-ups`)
                router.refresh()
              } else toast.error(res.error)
            },
          },
          {
            label: 'Reject',
            icon: XCircle,
            variant: 'danger',
            confirmTitle: 'Reject Top-ups',
            confirmMessage: `Are you sure you want to reject ${selectedIds.length} selected top-up requests?`,
            onClick: async (ids) => {
              const res = await bulkUpdatePaymentStatus(ids, 'REJECTED')
              if (res.success) {
                toast.success(`Rejected ${ids.length} top-ups`)
                router.refresh()
              } else toast.error(res.error)
            },
          },
        ]}
      />
    </div>
  )
}
