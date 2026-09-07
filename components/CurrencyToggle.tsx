'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

const CURRENCIES = ['EUR', 'GHS', 'USD'] as const
type Currency = (typeof CURRENCIES)[number]

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: 'â‚¬',
  GHS: 'GHâ‚µ',
  USD: '$',
}

interface CurrencyToggleProps {
  amount: number
  baseCurrency?: Currency
  className?: string
  showSymbol?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function CurrencyToggle({
  amount,
  baseCurrency = 'EUR',
  className = '',
  showSymbol = true,
  size = 'md',
}: CurrencyToggleProps) {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(baseCurrency)
  const [convertedAmount, setConvertedAmount] = useState<number>(amount)
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState<Record<string, number>>({})

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/exchange-rates?base=${baseCurrency.toLowerCase()}`)
      if (res.ok) {
        const data = await res.json()
        setRates(data.rates || {})
      }
    } catch (err) {
      console.error('Failed to fetch rates:', err)
    } finally {
      setLoading(false)
    }
  }, [baseCurrency])

  useEffect(() => {
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRates()
  }, [fetchRates])

  useEffect(() => {
   
    if (currentCurrency === baseCurrency) {
  // eslint-disable-next-line react-hooks/set-state-in-effect
      setConvertedAmount(amount)
    } else {
      const rate = rates[currentCurrency.toLowerCase()]
      if (rate) {
        setConvertedAmount(Math.round(amount * rate * 100) / 100)
      }
    }
  }, [currentCurrency, amount, baseCurrency, rates])

  const handleClick = () => {
    const currentIndex = CURRENCIES.indexOf(currentCurrency)
    const nextIndex = (currentIndex + 1) % CURRENCIES.length
    setCurrentCurrency(CURRENCIES[nextIndex])
  }

  const sizeClasses = {
    sm: 'text-xs gap-1 px-1.5 py-0.5',
    md: 'text-sm gap-1.5 px-2 py-1',
    lg: 'text-base gap-2 px-3 py-1.5',
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 ${sizeClasses[size]} ${className}`}
      title={`Click to convert: ${CURRENCIES.join(' â†’ ')}`}
      disabled={loading}
    >
      {loading ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : (
        <>
          {showSymbol && (
            <span className="font-bold text-slate-500 dark:text-slate-400">
              {CURRENCY_SYMBOLS[currentCurrency]}
            </span>
          )}
          <span>
            {convertedAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{currentCurrency}</span>
        </>
      )}
    </button>
  )
}
