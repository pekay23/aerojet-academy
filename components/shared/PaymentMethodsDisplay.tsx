'use client'

import { useState } from 'react'
import { Building2, Smartphone, CreditCard, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface PaymentMethodData {
  id: string
  type: string
  label: string
  currency: string
  bankName: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  bankSwiftCode: string | null
  bankBranch: string | null
  momoProvider: string | null
  momoNumber: string | null
  momoMerchantCode: string | null
  momoAccountName: string | null
}

interface PaymentMethodsDisplayProps {
  methods: PaymentMethodData[]
  reference?: string
  referenceLabel?: string
}

const TYPE_ICONS: Record<string, typeof Building2> = {
  BANK_TRANSFER: Building2,
  MOBILE_MONEY: Smartphone,
  CARD_STRIPE: CreditCard,
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      aria-label="Copy to clipboard"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function DetailRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string
  value: string | null
  mono?: boolean
  copyable?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-50 pb-3 last:border-0 dark:border-white/5">
      <dt className="text-xs font-black tracking-widest text-slate-400 uppercase">{label}</dt>
      <dd
        className={`flex items-center gap-1.5 text-right text-base font-bold text-slate-800 dark:text-slate-200 ${mono ? 'font-mono' : ''}`}
      >
        {value}
        {copyable && <CopyButton text={value} />}
      </dd>
    </div>
  )
}

function BankTransferDetails({
  method,
  reference,
  referenceLabel,
}: {
  method: PaymentMethodData
  reference?: string
  referenceLabel?: string
}) {
  return (
    <dl className="space-y-3">
      <DetailRow label="Bank" value={method.bankName} />
      <DetailRow label="Account Name" value={method.bankAccountName} />
      <DetailRow label="Account Number" value={method.bankAccountNumber} mono copyable />
      {method.bankSwiftCode && <DetailRow label="SWIFT / BIC" value={method.bankSwiftCode} mono />}
      {method.bankBranch && <DetailRow label="Branch / Code" value={method.bankBranch} />}
      <DetailRow label="Currency" value={method.currency} />
      {reference && (
        <div className="border-t border-slate-100 pt-2 dark:border-white/5">
          <DetailRow label={referenceLabel || 'Reference'} value={reference} mono copyable />
        </div>
      )}
    </dl>
  )
}

function MobileMoneyDetails({
  method,
  reference,
  referenceLabel,
}: {
  method: PaymentMethodData
  reference?: string
  referenceLabel?: string
}) {
  const providerNames: Record<string, string> = {
    MTN: 'MTN MoMo Pay',
    TELECEL: 'Telecel Cash',
    AIRTELTIGO: 'AirtelTigo Cash',
  }

  return (
    <dl className="space-y-3">
      <DetailRow
        label="Provider"
        value={providerNames[method.momoProvider || ''] || method.momoProvider}
      />
      <DetailRow label="Phone Number" value={method.momoNumber} mono copyable />
      {method.momoMerchantCode && (
        <DetailRow label="Merchant Code" value={method.momoMerchantCode} mono copyable />
      )}
      <DetailRow label="Account Name" value={method.momoAccountName} />
      <DetailRow label="Currency" value={method.currency} />
      {reference && (
        <div className="border-t border-slate-100 pt-2 dark:border-white/5">
          <DetailRow label={referenceLabel || 'Reference'} value={reference} mono copyable />
        </div>
      )}
    </dl>
  )
}

export default function PaymentMethodsDisplay({
  methods,
  reference,
  referenceLabel,
}: PaymentMethodsDisplayProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (methods.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-white/5 dark:bg-slate-900">
        <p className="text-sm text-slate-500">
          No payment methods available. Please contact the academy.
        </p>
      </div>
    )
  }

  const activeMethod = methods[activeIdx]

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 px-5 py-3 dark:bg-slate-900">
        <h4 className="flex items-center gap-2 text-sm font-bold text-white">
          <CreditCard className="h-4 w-4" /> Payment Details
        </h4>
      </div>

      {/* Method Tabs (only if multiple) */}
      {methods.length > 1 && (
        <div className="flex gap-1 border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/5 dark:bg-slate-800/50">
          {methods.map((m, idx) => {
            const Icon = TYPE_ICONS[m.type] || Building2
            const isActive = idx === activeIdx
            return (
              <button
                key={m.id}
                onClick={() => setActiveIdx(idx)}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'text-aerojet-blue dark:text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="payment-method-tab"
                    className="absolute inset-0 bg-white shadow-sm dark:bg-slate-700"
                    style={{ borderRadius: 8, zIndex: 0 }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">{m.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Details */}
      <div className="p-5">
        {activeMethod.type === 'BANK_TRANSFER' && (
          <BankTransferDetails
            method={activeMethod}
            reference={reference}
            referenceLabel={referenceLabel}
          />
        )}
        {activeMethod.type === 'MOBILE_MONEY' && (
          <MobileMoneyDetails
            method={activeMethod}
            reference={reference}
            referenceLabel={referenceLabel}
          />
        )}
        {activeMethod.type === 'CARD_STRIPE' && (
          <div className="py-4 text-center text-sm text-slate-500">
            Online card payments coming soon.
          </div>
        )}
      </div>
    </div>
  )
}
