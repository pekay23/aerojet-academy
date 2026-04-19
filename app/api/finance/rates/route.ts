import { NextResponse } from 'next/server'
import { fetchExchangeRates } from '@/lib/currency-api'
import prisma from '@/lib/prisma/client'

export async function GET() {
  try {
    const [eurRates, manualGhs, manualUsd] = await Promise.all([
      fetchExchangeRates('eur'),
      prisma.systemSetting.findUnique({ where: { key: 'exchange_rate_eur_ghs' } }),
      prisma.systemSetting.findUnique({ where: { key: 'exchange_rate_eur_usd' } }),
    ])

    const manualGhsVal = manualGhs?.value ? parseFloat(manualGhs.value) : 0
    const manualUsdVal = manualUsd?.value ? parseFloat(manualUsd.value) : 0

    const rates = {
      EUR: 1,
      GHS: manualGhsVal > 0 ? manualGhsVal : (eurRates['ghs'] || 0),
      USD: manualUsdVal > 0 ? manualUsdVal : (eurRates['usd'] || 0),
    }

    const sources = {
      GHS: manualGhsVal > 0 ? 'admin' : 'auto',
      USD: manualUsdVal > 0 ? 'admin' : 'auto',
    }

    return NextResponse.json({ 
      rates, 
      external: {
        GHS: eurRates['ghs'] || 0,
        USD: eurRates['usd'] || 0,
      },
      manual: {
        GHS: manualGhsVal,
        USD: manualUsdVal,
      },
      sources, 
      base: 'EUR', 
      timestamp: Date.now() 
    })
  } catch (error) {
    console.error('[Rates API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    )
  }
}
