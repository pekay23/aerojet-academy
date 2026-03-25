// Re-export from centralized currency utility
export { getCurrencySymbol, formatCurrency } from '@/lib/currency'

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
}
