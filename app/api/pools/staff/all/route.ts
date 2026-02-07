import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch ALL pools for staff management view
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const pools = await prisma.examPool.findMany({
      include: {
        template: true,
        modules: { orderBy: { demandCount: 'desc' } },
        _count: { select: { participants: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ pools });
  } catch (error) {
    console.error('Error fetching pools:', error);
    return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 });
  }
}
