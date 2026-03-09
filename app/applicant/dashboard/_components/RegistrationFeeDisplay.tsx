'use client'

import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'

interface RegistrationFeeDisplayProps {
  fee: number
  currency: string
}

export default function RegistrationFeeDisplay({ fee, currency }: RegistrationFeeDisplayProps) {
  return (
    <div className="inline-block rounded-xl border border-slate-100 bg-white/50 px-3 py-1.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/50">
      <CurrencyDisplay
        amount={fee}
        baseCurrency={currency}
        showToggle={true}
        showDisclaimer={true}
        size="sm"
      />
    </div>
  )
}
