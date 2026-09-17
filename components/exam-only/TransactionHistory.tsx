'use client'

import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  referenceType?: string
  balanceBefore?: number
  balanceAfter?: number
  createdAt: string
}

interface TransactionHistoryProps {
  walletId?: string
}

export function TransactionHistory({ walletId: _walletId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const perPage = 10

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/applicant/exam-only/wallet')
      const data = await res.json()
      if (data.transactions) {
        setTransactions(data.transactions)
      }
    } catch {
      console.error('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TOP_UP':
        return '💳'
      case 'PAYMENT':
        return '💸'
      case 'RESERVE':
        return '🔒'
      case 'RELEASE':
        return '🔓'
      case 'CREDIT':
        return '💰'
      case 'REFUND':
        return '↩️'
      default:
        return '📋'
    }
  }

  const getTypeColorClass = (type: string) => {
    switch (type) {
      case 'TOP_UP':
      case 'CREDIT':
      case 'REFUND':
      case 'RELEASE':
        return 'text-[#10b981]'
      case 'PAYMENT':
        return 'text-[#ef4444]'
      case 'RESERVE':
        return 'text-[#f59e0b]'
      default:
        return 'text-[#888]'
    }
  }

  const paginatedTx = transactions.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(transactions.length / perPage)

  if (isLoading) {
    return (
      <div className="p-5 text-center text-[#888]">
        Loading transactions...
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="p-5 text-center text-[#888]">
        No transactions yet. Top up your wallet to get started.
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-px">
        {paginatedTx.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between py-3 px-4 bg-white/[0.02] border-b border-white/[0.06] transition-[background] duration-150"
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-[18px]">{getTypeIcon(tx.type)}</span>
              <div>
                <div className="text-[13px] font-medium text-[#e0e0e0]">
                  {tx.description}
                </div>
                <div className="text-[11px] text-[#888] mt-0.5">
                  {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {tx.referenceType && (
                    <span className="ml-2 text-[#666]">• {tx.referenceType}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-[14px] font-semibold ${getTypeColorClass(tx.type)}`}>
                {['TOP_UP', 'CREDIT', 'REFUND', 'RELEASE'].includes(tx.type) ? '+' : '-'}€
                {Number(tx.amount).toFixed(2)}
              </div>
              {tx.balanceAfter !== undefined && (
                <div className="text-[11px] text-[#666]">
                  Balance: €{Number(tx.balanceAfter).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 p-3 mt-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={`py-1 px-3 border-none rounded text-[12px] ${
              page === 1
                ? 'bg-white/[0.05] text-[#666] cursor-default'
                : 'bg-[rgba(59,130,246,0.2)] text-[#93c5fd] cursor-pointer'
            }`}
          >
            ← Prev
          </button>
          <span className="text-[12px] text-[#888] py-1 px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className={`py-1 px-3 border-none rounded text-[12px] ${
              page === totalPages
                ? 'bg-white/[0.05] text-[#666] cursor-default'
                : 'bg-[rgba(59,130,246,0.2)] text-[#93c5fd] cursor-pointer'
            }`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
