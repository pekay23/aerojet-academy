import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List available pools (with user-specific metadata)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeJoined = searchParams.get('includeJoined') === 'true';

  try {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
    if (!student) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });

    const pools = await prisma.examPool.findMany({
      where: {
        status: { in: ['OPEN', 'NEARLY_FULL'] },
        joinDeadline: { gte: new Date() }
      },
      include: {
        template: true,
        modules: { orderBy: { moduleCode: 'asc' } },
        participants: {
          where: includeJoined ? { studentId: student.id } : undefined,
          include: { reservation: true }
        }
      },
      orderBy: { examDate: 'asc' }
    });

    const poolsWithMetadata = pools.map(pool => {
      const fillPercentage = (pool.currentCount / pool.maxCandidates) * 100;
      const userParticipant = pool.participants.find(p => p.studentId === student.id);
      
      return {
        ...pool,
        fillPercentage: Math.round(fillPercentage),
        spotsRemaining: pool.maxCandidates - pool.currentCount,
        isUserJoined: !!userParticipant,
        userStatus: userParticipant?.status,
        userModules: userParticipant?.requestedModules,
        canJoin: pool.status === 'OPEN' && !userParticipant
      };
    });

    return NextResponse.json({ pools: poolsWithMetadata });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 });
  }
}

// POST: Create a new pool (Admin/Staff only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, examDate, minCandidates = 25, maxCandidates = 28 } = await req.json();
    
    // Set deadlines relative to exam date
    const dateObj = new Date(examDate);
    const joinDeadline = new Date(dateObj); joinDeadline.setDate(dateObj.getDate() - 45);
    const confirmDeadline = new Date(dateObj); confirmDeadline.setDate(dateObj.getDate() - 21);

    const pool = await prisma.examPool.create({
      data: {
        name,
        examDate: dateObj,
        joinDeadline,
        confirmDeadline,
        minCandidates,
        maxCandidates,
        status: 'OPEN'
      }
    });

    return NextResponse.json({ pool }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create pool' }, { status: 500 });
  }
}
