import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { getFinanceOverviewData } from '@/lib/finance/overview'
import { unstable_cache } from 'next/cache'

const getCachedFinanceOverview = unstable_cache(
  async () => getFinanceOverviewData(),
  ['finance-overview'],
  { revalidate: 60, tags: ['finance-overview'] }
)

export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await getCachedFinanceOverview())
}
