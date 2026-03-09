'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCurrencySymbol } from '@/lib/currency'

// ---------------------------------------------------------------------------
// useCurrencyRates – fetches and caches exchange rates from the API
// ---------------------------------------------------------------------------

interface UseCurrencyRatesReturn {
  rates: Record<string, number>
  sources: Record<string, 'admin' | 'auto'>
  loading: boolean
  error: string | null
  convert: (amount: number, from: string, to: string) => number
}

export function useCurrencyRates(): UseCurrencyRatesReturn {
  const [rates, setRates] = useState<Record<string, number>>({})
  const [sources, setSources] = useState<Record<string, 'admin' | 'auto'>>({})
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
          setRates(data.rates ?? data)
          setSources(data.sources ?? {})
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

      // Convert via base (EUR is base 1)
      const inBase = amount / fromRate
      return Math.round(inBase * toRate * 100) / 100
    },
    [rates],
  )

  return { rates, sources, loading, error, convert }
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
  clickToToggle?: boolean
  className?: string
  amountClassName?: string
  size?: 'sm' | 'md' | 'lg'
  showDisclaimer?: boolean
  onCurrencyChange?: (currency: string) => void
}

export function CurrencyDisplay({
  amount,
  baseCurrency = 'EUR',
  showToggle = false,
  clickToToggle = false,
  className = '',
  amountClassName = '',
  size = 'md',
  showDisclaimer = false,
  onCurrencyChange,
}: CurrencyDisplayProps) {
  const [activeCurrency, setActiveCurrency] = useState(baseCurrency)
  const { rates, sources, loading, convert } = useCurrencyRates()

  const handleCurrencyChange = useCallback(
    (newCurrency: string) => {
      setActiveCurrency(newCurrency)
      onCurrencyChange?.(newCurrency)
    },
    [onCurrencyChange],
  )

  const handleClick = () => {
    if (!clickToToggle) return
    const currentIndex = SUPPORTED_CURRENCIES.indexOf(activeCurrency.toUpperCase())
    const nextIndex = (currentIndex + 1) % SUPPORTED_CURRENCIES.length
    handleCurrencyChange(SUPPORTED_CURRENCIES[nextIndex])
  }

  const displayAmount =
    activeCurrency.toUpperCase() === baseCurrency.toUpperCase()
      ? amount
      : convert(amount, baseCurrency, activeCurrency)

  const formatted = formatAmount(displayAmount, activeCurrency)
  const textSize = sizeClasses[size] ?? sizeClasses.md

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className="inline-flex items-center gap-2">
        <div
          onClick={handleClick}
          className={`inline-flex items-center gap-2 transition-all duration-200 ${
            clickToToggle
              ? 'cursor-pointer hover:opacity-80 active:scale-[0.98]'
              : 'cursor-default transition-none'
          }`}
          title={clickToToggle ? `Click to cycle: ${SUPPORTED_CURRENCIES.join(' → ')}` : undefined}
        >
          <span
            className={`font-black transition-all duration-200 ${
              amountClassName || 'text-slate-900 dark:text-white'
            } ${textSize}`}
          >
            {loading && activeCurrency.toUpperCase() !== baseCurrency.toUpperCase()
              ? '...'
              : formatted}
          </span>
          {clickToToggle && activeCurrency.toUpperCase() !== 'EUR' && (
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              {activeCurrency}
            </span>
          )}
        </div>
        {showToggle && (
          <CurrencyToggle
            value={activeCurrency}
            onChange={handleCurrencyChange}
            size={size === 'lg' ? 'md' : 'sm'}
          />
        )}
      </div>
      {showDisclaimer && activeCurrency.toUpperCase() !== baseCurrency.toUpperCase() && (
        <p className="max-w-[200px] text-[10px] leading-tight text-slate-400 dark:text-slate-500">
          {sources[activeCurrency.toUpperCase()] === 'admin' ? (
            <span className="font-semibold text-blue-500 dark:text-blue-400">
              Official Academy Rate. Check with your bank for any transfer fees.
            </span>
          ) : (
            <span>Indicative bank rate. Check with your bank for the official rate.</span>
          )}
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
