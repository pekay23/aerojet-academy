
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const pools = await prisma.examPool.findMany({
    where: {
      name: { contains: 'Auto' }
    },
    select: {
      id: true,
      name: true,
      isAutoPool: true,
      poolType: true,
      status: true
    }
  });

  return NextResponse.json(pools)
}
