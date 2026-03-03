import { NextResponse } from 'next/server'
import { fetchExchangeRates, getMultiCurrencyValues } from '@/lib/currency-api'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const base = searchParams.get('base') || 'eur'
    const amount = searchParams.get('amount')
    const to = searchParams.get('to')

    // If amount is provided, return multi-currency conversion
    if (amount) {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount)) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
      }

      const result = await getMultiCurrencyValues(numAmount, base)
      return NextResponse.json(result)
    }

    // Otherwise return all rates for the base currency
    const rates = await fetchExchangeRates(base)

    // Return only the commonly used rates if no specific currency requested
    if (to) {
      const rate = rates[to.toLowerCase()]
      if (!rate) {
        return NextResponse.json({ error: `Rate not found for ${to}` }, { status: 404 })
      }
      return NextResponse.json({ base, to, rate })
    }

    return NextResponse.json({
      base,
      rates: {
        eur: rates['eur'] || 1,
        ghs: rates['ghs'],
        usd: rates['usd'],
        gbp: rates['gbp'],
      },
    })
  } catch (error) {
    console.error('Exchange rate API error:', error)
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
  }
}
