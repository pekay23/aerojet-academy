'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Building2,
  Smartphone,
  CreditCard,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

type PaymentMethodType = 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CARD_STRIPE'

interface PaymentMethod {
  id: string
  type: PaymentMethodType
  label: string
  currency: string
  isActive: boolean
  sortOrder: number
  bankName: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  bankSwiftCode: string | null
  bankBranch: string | null
  momoProvider: string | null
  momoNumber: string | null
  momoMerchantCode: string | null
  momoAccountName: string | null
  stripeAccountId: string | null
}

const TYPE_META: Record<PaymentMethodType, { label: string; icon: typeof Building2 }> = {
  BANK_TRANSFER: { label: 'Bank Transfer', icon: Building2 },
  MOBILE_MONEY: { label: 'Mobile Money', icon: Smartphone },
  CARD_STRIPE: { label: 'Card (Stripe)', icon: CreditCard },
}

const CURRENCIES = ['GHS', 'EUR', 'USD']
const MOMO_PROVIDERS = [
  { value: 'MTN', label: 'MTN MoMo Pay' },
  { value: 'TELECEL', label: 'Telecel Cash' },
  { value: 'AIRTELTIGO', label: 'AirtelTigo Cash' },
]

const emptyForm = {
  type: 'BANK_TRANSFER' as PaymentMethodType,
  label: '',
  currency: 'GHS',
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
  bankSwiftCode: '',
  bankBranch: '',
  momoProvider: 'MTN',
  momoNumber: '',
  momoMerchantCode: '',
  momoAccountName: '',
  stripeAccountId: '',
}

export default function PaymentMethodsManager() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)

  const fetchMethods = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/payment-methods')
      if (res.ok) {
        const data = await res.json()
        setMethods(data.data || [])
      }
    } catch {
      toast.error('Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchMethods() }, [fetchMethods])

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/staff/payment-methods/${id}/toggle`, { method: 'PATCH' })
      if (res.ok) {
        const data = await res.json()
        setMethods((prev) => prev.map((m) => (m.id === id ? data.data : m)))
        toast.success('Payment method updated')
      }
    } catch {
      toast.error('Failed to toggle')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return
    try {
      const res = await fetch(`/api/staff/payment-methods/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMethods((prev) => prev.filter((m) => m.id !== id))
        toast.success('Payment method deleted')
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const idx = methods.findIndex((m) => m.id === id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === methods.length - 1)) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const updated = [...methods]
    const temp = updated[idx].sortOrder
    updated[idx] = { ...updated[idx], sortOrder: updated[swapIdx].sortOrder }
    updated[swapIdx] = { ...updated[swapIdx], sortOrder: temp }
    ;[updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]]
    setMethods(updated)

    // Persist sort orders
    await Promise.all([
      fetch(`/api/staff/payment-methods/${updated[idx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: updated[idx].sortOrder }),
      }),
      fetch(`/api/staff/payment-methods/${updated[swapIdx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: updated[swapIdx].sortOrder }),
      }),
    ])
  }

  const startEdit = (method: PaymentMethod) => {
    setEditingId(method.id)
    setForm({
      type: method.type,
      label: method.label,
      currency: method.currency,
      bankName: method.bankName || '',
      bankAccountName: method.bankAccountName || '',
      bankAccountNumber: method.bankAccountNumber || '',
      bankSwiftCode: method.bankSwiftCode || '',
      bankBranch: method.bankBranch || '',
      momoProvider: method.momoProvider || 'MTN',
      momoNumber: method.momoNumber || '',
      momoMerchantCode: method.momoMerchantCode || '',
      momoAccountName: method.momoAccountName || '',
      stripeAccountId: method.stripeAccountId || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.label.trim()) { toast.error('Label is required'); return }

    setSubmitting(true)
    try {
      const url = editingId ? `/api/staff/payment-methods/${editingId}` : '/api/staff/payment-methods'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        toast.success(editingId ? 'Payment method updated' : 'Payment method added')
        setShowForm(false)
        setEditingId(null)
        setForm({ ...emptyForm })
        fetchMethods()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save')
      }
    } catch {
      toast.error('Error saving payment method')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyForm })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Loading payment methods...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Payment Methods</h3>
          <p className="text-xs text-slate-500">
            Manage bank accounts, mobile money, and card payment options visible to applicants and students.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }) }}
          className="flex items-center gap-1.5 rounded-xl bg-aerojet-blue px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#003875]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Method
        </button>
      </div>

      {/* Methods List */}
      {methods.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No payment methods configured</p>
          <p className="text-xs text-slate-400">Add a bank account or mobile money option to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {methods.map((m, idx) => {
            const meta = TYPE_META[m.type as PaymentMethodType] || TYPE_META.BANK_TRANSFER
            const Icon = meta.icon
            return (
              <div
                key={m.id}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                  m.isActive
                    ? 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900'
                    : 'border-slate-100 bg-slate-50 opacity-60 dark:border-white/5 dark:bg-slate-900/50'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  m.isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{m.label}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                      {m.currency}
                    </span>
                    <span className="text-[10px] text-slate-400">{meta.label}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {m.type === 'BANK_TRANSFER' && `${m.bankName || ''} Â· ${m.bankAccountNumber || ''}`}
                    {m.type === 'MOBILE_MONEY' && `${m.momoProvider || ''} Â· ${m.momoNumber || ''}`}
                    {m.type === 'CARD_STRIPE' && 'Online card payments'}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => handleReorder(m.id, 'up')} disabled={idx === 0}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleReorder(m.id, 'down')} disabled={idx === methods.length - 1}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  <button onClick={() => handleToggle(m.id)}
                    className="rounded-lg p-1.5 transition-colors hover:bg-slate-100"
                    title={m.isActive ? 'Disable' : 'Enable'}
                  >
                    {m.isActive ? (
                      <ToggleRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-slate-300" />
                    )}
                  </button>

                  <button onClick={() => startEdit(m)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button onClick={() => handleDelete(m.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Form Overlay */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-6 dark:border-blue-800 dark:bg-blue-900/10">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {editingId ? 'Edit Payment Method' : 'Add Payment Method'}
            </h4>
            <button onClick={cancelForm} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selection */}
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(TYPE_META) as [PaymentMethodType, typeof TYPE_META.BANK_TRANSFER][]).map(([type, meta]) => {
                const Icon = meta.icon
                const isSelected = form.type === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, type })}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-aerojet-blue bg-aerojet-blue/5 text-aerojet-blue'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {meta.label}
                  </button>
                )
              })}
            </div>

            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Display Label *</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder={form.type === 'BANK_TRANSFER' ? 'e.g. FNB Bank (GHS)' : form.type === 'MOBILE_MONEY' ? 'e.g. MTN MoMo Pay' : 'e.g. Stripe'}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/10 focus:outline-none dark:border-white/10 dark:bg-black/20 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Currency *</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/10 focus:outline-none dark:border-white/10 dark:bg-black/20 dark:text-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bank Transfer Fields */}
            {form.type === 'BANK_TRANSFER' && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Bank Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Bank Name" value={form.bankName} onChange={(v) => setForm({ ...form, bankName: v })} placeholder="e.g. FNB Bank" />
                  <Input label="Account Name" value={form.bankAccountName} onChange={(v) => setForm({ ...form, bankAccountName: v })} placeholder="e.g. AEROJET FOUNDATION" />
                  <Input label="Account Number" value={form.bankAccountNumber} onChange={(v) => setForm({ ...form, bankAccountNumber: v })} placeholder="e.g. 1020003980687" />
                  <Input label="SWIFT / BIC Code" value={form.bankSwiftCode} onChange={(v) => setForm({ ...form, bankSwiftCode: v })} placeholder="e.g. FIRNGHACXXX" />
                  <Input label="Branch / Code" value={form.bankBranch} onChange={(v) => setForm({ ...form, bankBranch: v })} placeholder="e.g. 330102" />
                </div>
              </div>
            )}

            {/* Mobile Money Fields */}
            {form.type === 'MOBILE_MONEY' && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Mobile Money Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">Provider</label>
                    <select
                      value={form.momoProvider}
                      onChange={(e) => setForm({ ...form, momoProvider: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/10 focus:outline-none dark:border-white/10 dark:bg-black/20 dark:text-white"
                    >
                      {MOMO_PROVIDERS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <Input label="Phone Number" value={form.momoNumber} onChange={(v) => setForm({ ...form, momoNumber: v })} placeholder="e.g. 024 123 4567" />
                  <Input label="Merchant Code" value={form.momoMerchantCode} onChange={(v) => setForm({ ...form, momoMerchantCode: v })} placeholder="Optional" />
                  <Input label="Account Name" value={form.momoAccountName} onChange={(v) => setForm({ ...form, momoAccountName: v })} placeholder="e.g. Aerojet Academy" />
                </div>
              </div>
            )}

            {/* Stripe Fields */}
            {form.type === 'CARD_STRIPE' && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Stripe Configuration</p>
                <Input label="Stripe Account ID" value={form.stripeAccountId} onChange={(v) => setForm({ ...form, stripeAccountId: v })} placeholder="e.g. acct_..." />
                <p className="text-xs text-amber-600">Stripe integration is coming soon. You can add the account ID now for future use.</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={cancelForm} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#003875] disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? 'Update' : 'Add Method'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-slate-600">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/10 focus:outline-none dark:border-white/10 dark:bg-black/20 dark:text-white"
      />
    </div>
  )
}
