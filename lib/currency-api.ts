/**
 * Currency conversion service using fawazahmed0/currency-api
 * Supports EUR, GHS, USD and 200+ currencies
 * Includes fallback mechanism (jsdelivr -> cloudflare)
 */

// Cache exchange rates for 1 hour
const rateCache: Map<string, { rates: Record<string, number>; timestamp: number }> = new Map()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

const PRIMARY_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies'
const FALLBACK_URL = 'https://latest.currency-api.pages.dev/v1/currencies'

/**
 * Fetch exchange rates for a base currency with fallback
 */
export async function fetchExchangeRates(
  baseCurrency: string = 'eur'
): Promise<Record<string, number>> {
  const base = baseCurrency.toLowerCase()
  const cached = rateCache.get(base)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rates
  }

  // Try primary URL first
  try {
    const res = await fetch(`${PRIMARY_URL}/${base}.min.json`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const data = await res.json()
      const rates = data[base] || {}
      rateCache.set(base, { rates, timestamp: Date.now() })
      return rates
    }
  } catch (e) {
    console.warn('[Currency API] Primary URL failed, trying fallback:', e)
  }

  // Fallback URL
  try {
    const res = await fetch(`${FALLBACK_URL}/${base}.min.json`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const data = await res.json()
      const rates = data[base] || {}
      rateCache.set(base, { rates, timestamp: Date.now() })
      return rates
    }
  } catch (e) {
    console.error('[Currency API] Fallback URL also failed:', e)
  }

  throw new Error(`Failed to fetch exchange rates for ${base}`)
}

/**
 * Convert an amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<{ convertedAmount: number; rate: number }> {
  if (from.toLowerCase() === to.toLowerCase()) {
    return { convertedAmount: amount, rate: 1 }
  }

  const rates = await fetchExchangeRates(from)
  const rate = rates[to.toLowerCase()]

  if (!rate) {
    throw new Error(`Exchange rate not found for ${from} -> ${to}`)
  }

  return {
    convertedAmount: Math.round(amount * rate * 100) / 100,
    rate,
  }
}

/**
 * Get a specific exchange rate between two currencies
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from.toLowerCase() === to.toLowerCase()) return 1

  const rates = await fetchExchangeRates(from)
  const rate = rates[to.toLowerCase()]

  if (!rate) {
    throw new Error(`Exchange rate not found for ${from} -> ${to}`)
  }

  return rate
}

/**
 * Convert GHS payment to EUR equivalent using live rates
 */
export async function convertGhsToEur(ghsAmount: number): Promise<{
  eurAmount: number
  rate: number
}> {
  const result = await convertCurrency(ghsAmount, 'ghs', 'eur')
  return { eurAmount: result.convertedAmount, rate: result.rate }
}

/**
 * Get multiple currency conversions from a base amount
 */
export async function getMultiCurrencyValues(
  amount: number,
  baseCurrency: string = 'eur'
): Promise<{
  eur: number
  ghs: number
  usd: number
  rates: { eur: number; ghs: number; usd: number }
}> {
  const rates = await fetchExchangeRates(baseCurrency)
  const base = baseCurrency.toLowerCase()

  const eurRate = base === 'eur' ? 1 : rates['eur'] || 1
  const ghsRate = base === 'ghs' ? 1 : rates['ghs'] || 1
  const usdRate = base === 'usd' ? 1 : rates['usd'] || 1

  return {
    eur: Math.round(amount * eurRate * 100) / 100,
    ghs: Math.round(amount * ghsRate * 100) / 100,
    usd: Math.round(amount * usdRate * 100) / 100,
    rates: { eur: eurRate, ghs: ghsRate, usd: usdRate },
  }
}
