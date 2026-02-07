import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Merge two pools
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { sourcePoolId, targetPoolId } = await req.json();

    await prisma.$transaction(async (tx) => {
      // 1. Move all participants from Source to Target
      await tx.poolParticipant.updateMany({
        where: { poolId: sourcePoolId },
        data: { poolId: targetPoolId }
      });

      // 2. Recalculate Target Count
      const count = await tx.poolParticipant.count({ where: { poolId: targetPoolId } });
      
      // 3. Update Target Pool
      await tx.examPool.update({
        where: { id: targetPoolId },
        data: { currentCount: count }
      });

      // 4. Cancel Source Pool
      await tx.examPool.update({
        where: { id: sourcePoolId },
        data: { status: 'CANCELLED', currentCount: 0 }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Find Eligible Merge Candidates
export async function GET(req: Request) {
  // Simple logic: Find all OPEN pools
  const pools = await prisma.examPool.findMany({
    where: { status: { in: ['OPEN', 'NEARLY_FULL'] } },
    orderBy: { examDate: 'asc' }
  });

  // Pairing logic would go here (simplified for now)
  const eligiblePairs = [];
  for (let i = 0; i < pools.length - 1; i++) {
    eligiblePairs.push({
      poolA: { id: pools[i].id, name: pools[i].name, count: pools[i].currentCount },
      poolB: { id: pools[i+1].id, name: pools[i+1].name, count: pools[i+1].currentCount },
      recommendation: 'Possible'
    });
  }

  return NextResponse.json({ eligiblePairs });
}
