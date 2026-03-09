'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCurrencySymbol } from '@/lib/currency'

// ---------------------------------------------------------------------------
// useCurrencyRates – fetches and caches exchange rates from the API
// ---------------------------------------------------------------------------

interface UseCurrencyRatesReturn {
  rates: Record<string, number>
  loading: boolean
  error: string | null
  convert: (amount: number, from: string, to: string) => number
}

export function useCurrencyRates(): UseCurrencyRatesReturn {
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchRates() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/finance/rates')
        if (!res.ok) throw new Error(`Failed to fetch rates (${res.status})`)
        const data = await res.json()
        if (!cancelled) {
          // Expect { rates: { eur: 1, ghs: x, usd: y } } or flat object
          setRates(data.rates ?? data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch rates')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRates()
    return () => {
      cancelled = true
    }
  }, [])

  const convert = useCallback(
    (amount: number, from: string, to: string): number => {
      if (from.toUpperCase() === to.toUpperCase()) return amount

      const fromKey = from.toUpperCase()
      const toKey = to.toUpperCase()
      const fromRate = rates[fromKey] ?? rates[from.toLowerCase()]
      const toRate = rates[toKey] ?? rates[to.toLowerCase()]

      if (!fromRate || !toRate) return amount

      // Convert via base: amount in "from" -> base -> "to"
      const inBase = amount / fromRate
      return Math.round(inBase * toRate * 100) / 100
    },
    [rates],
  )

  return { rates, loading, error, convert }
}

// ---------------------------------------------------------------------------
// CurrencyToggle – pill buttons for switching between currencies
// ---------------------------------------------------------------------------

const SUPPORTED_CURRENCIES = ['EUR', 'GHS', 'USD']

interface CurrencyToggleProps {
  value: string
  onChange: (currency: string) => void
  currencies?: string[]
  size?: 'sm' | 'md'
}

export function CurrencyToggle({
  value,
  onChange,
  currencies = SUPPORTED_CURRENCIES,
  size = 'md',
}: CurrencyToggleProps) {
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
      {currencies.map((currency) => {
        const isActive = currency === value
        return (
          <button
            key={currency}
            type="button"
            onClick={() => onChange(currency)}
            className={`rounded-lg font-medium transition-all duration-200 ${paddingClass} ${
              isActive
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {getCurrencySymbol(currency)} {currency}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CurrencyDisplay – shows a formatted amount with optional currency toggle
// ---------------------------------------------------------------------------

const sizeClasses: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
}

interface CurrencyDisplayProps {
  amount: number
  baseCurrency?: string
  showToggle?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showDisclaimer?: boolean
}

export function CurrencyDisplay({
  amount,
  baseCurrency = 'EUR',
  showToggle = false,
  className = '',
  size = 'md',
  showDisclaimer = false,
}: CurrencyDisplayProps) {
  const [activeCurrency, setActiveCurrency] = useState(baseCurrency)
  const { rates, loading, convert } = useCurrencyRates()

  const displayAmount =
    activeCurrency === baseCurrency ? amount : convert(amount, baseCurrency, activeCurrency)

  const formatted = formatAmount(displayAmount, activeCurrency)
  const textSize = sizeClasses[size] ?? sizeClasses.md

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className="inline-flex items-center gap-2">
        <span
          className={`font-black text-slate-900 transition-all duration-200 dark:text-white ${textSize}`}
        >
          {loading && activeCurrency !== baseCurrency ? '...' : formatted}
        </span>
        {showToggle && (
          <CurrencyToggle
            value={activeCurrency}
            onChange={setActiveCurrency}
            size={size === 'lg' ? 'md' : 'sm'}
          />
        )}
      </div>
      {showDisclaimer && activeCurrency !== baseCurrency && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Converted at indicative bank rate. Please check with your bank for the official and
          approved rate when making payment.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(value: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)
  const formatted = value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${symbol}${formatted}`
}
