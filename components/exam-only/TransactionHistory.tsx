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

export function TransactionHistory({ walletId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const perPage = 10

  useEffect(() => {
    fetchTransactions()
  }, [])

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TOP_UP':
      case 'CREDIT':
      case 'REFUND':
      case 'RELEASE':
        return '#10b981'
      case 'PAYMENT':
        return '#ef4444'
      case 'RESERVE':
        return '#f59e0b'
      default:
        return '#888'
    }
  }

  const paginatedTx = transactions.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(transactions.length / perPage)

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        Loading transactions...
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        No transactions yet. Top up your wallet to get started.
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {paginatedTx.map((tx) => (
          <div
            key={tx.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <span style={{ fontSize: '18px' }}>{getTypeIcon(tx.type)}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0' }}>
                  {tx.description}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {tx.referenceType && (
                    <span style={{ marginLeft: '8px', color: '#666' }}>• {tx.referenceType}</span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: getTypeColor(tx.type),
                }}
              >
                {['TOP_UP', 'CREDIT', 'REFUND', 'RELEASE'].includes(tx.type) ? '+' : '-'}€
                {Number(tx.amount).toFixed(2)}
              </div>
              {tx.balanceAfter !== undefined && (
                <div style={{ fontSize: '11px', color: '#666' }}>
                  Balance: €{Number(tx.balanceAfter).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            marginTop: '8px',
          }}
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              padding: '4px 12px',
              background: page === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.2)',
              color: page === 1 ? '#666' : '#93c5fd',
              border: 'none',
              borderRadius: '4px',
              cursor: page === 1 ? 'default' : 'pointer',
              fontSize: '12px',
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '12px', color: '#888', padding: '4px 8px' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              padding: '4px 12px',
              background:
                page === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.2)',
              color: page === totalPages ? '#666' : '#93c5fd',
              border: 'none',
              borderRadius: '4px',
              cursor: page === totalPages ? 'default' : 'pointer',
              fontSize: '12px',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
