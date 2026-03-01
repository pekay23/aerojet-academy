export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'EUR':
      return '€'
    case 'GHS':
      return 'GH₵'
    case 'USD':
      return '$'
    default:
      return '€'
  }
}

export function formatCurrency(amount: number | string, currency: string = 'EUR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${num.toLocaleString()}`
}
