'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  RefreshCw,
  Search,
  FileCheck,
  Calendar,
  User,
  ExternalLink,
  ChevronDown,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Payment {
  id: string
  amount: number
  currency: string
  paymentMethod: string
  referenceType: string
  referenceCode: string
  proofUrl: string
  createdAt: string
  approvedAt: string
  user: {
    email: string
    profile?: { firstName: string; lastName: string } | null
  }
}

export default function ReconciliationQueue() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/staff/finance/reconcile/pending')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPayments(data.payments || [])
    } catch {
      toast.error('Failed to load pending payments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleReconcile = async () => {
    if (selectedIds.length === 0) return

    setIsProcessing(true)
    try {
      const res = await fetch('/api/staff/finance/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIds: selectedIds }),
      })

      if (!res.ok) throw new Error()

      const data = await res.json()
      toast.success(data.message)
      setPayments((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
      setSelectedIds([])
    } catch {
      toast.error('Reconciliation failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === filteredPayments.length ? [] : filteredPayments.map((p) => p.id)
    )
  }

  const filteredPayments = payments.filter((p) => {
    const searchLow = search.toLowerCase()
    const name = p.user.profile ? `${p.user.profile.firstName} ${p.user.profile.lastName}` : ''
    return (
      p.user.email.toLowerCase().includes(searchLow) ||
      name.toLowerCase().includes(searchLow) ||
      p.referenceCode?.toLowerCase().includes(searchLow)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-aerojet-blue text-2xl font-black tracking-tight uppercase dark:text-white">
            Finance Reconciliation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Verify approved payments against bank statements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayments}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleReconcile}
            disabled={selectedIds.length === 0 || isProcessing}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-black tracking-widest text-white uppercase transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4" />
            )}
            Reconcile {selectedIds.length > 0 && `(${selectedIds.length})`}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, email or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === filteredPayments.length && filteredPayments.length > 0
                    }
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 transition-all checked:bg-blue-600"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Student
                </th>
                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Payment Details
                </th>
                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Approval
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8">
                      <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                    <p className="text-sm font-bold text-slate-400">
                      No payments awaiting reconciliation
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="h-4 w-4 rounded border-slate-300 transition-all checked:bg-blue-600"
                      />
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {p.user.profile
                          ? `${p.user.profile.firstName} ${p.user.profile.lastName}`
                          : 'System User'}
                      </div>
                      <div className="text-xs text-slate-500">{p.user.email}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-aerojet-blue text-sm font-black dark:text-blue-400">
                        {p.currency} {Number(p.amount).toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                        <span>{p.paymentMethod.replace(/_/g, ' ')}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="font-mono">{p.referenceCode || 'No Ref'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(p.approvedAt), 'MMM d, yyyy')}
                      </div>
                      {p.proofUrl && (
                        <a
                          href={p.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center gap-1 text-[10px] font-black tracking-widest text-[#4c9ded] uppercase hover:underline dark:text-blue-400"
                        >
                          <ExternalLink className="h-3 w-3" /> View Proof
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => toggleSelect(p.id)}
                        className={`rounded-xl px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all ${
                          selectedIds.includes(p.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {selectedIds.includes(p.id) ? 'Selected' : 'Reconcile'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
