import { NextResponse } from 'next/server'
import { fetchExchangeRates } from '@/lib/currency-api'

export async function GET() {
  try {
    const eurRates = await fetchExchangeRates('eur')

    const rates = {
      EUR: 1,
      GHS: eurRates['ghs'] || 0,
      USD: eurRates['usd'] || 0,
    }

    return NextResponse.json({ rates, base: 'EUR', timestamp: Date.now() })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    )
  }
}
