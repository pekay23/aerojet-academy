import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all Exam Pools (Replaces Runs)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const pools = await prisma.examPool.findMany({
      include: {
        event: true,
        // Count bookings/memberships
        _count: { select: { memberships: true } }
      },
      orderBy: { examDate: 'desc' }
    });
    
    // Also fetch Events (Windows) for the Create form
    const events = await prisma.examEvent.findMany({
        where: { status: 'OPEN' }
    });

    return NextResponse.json({ pools, events });
  } catch (error) {
    console.error("GET_POOLS_ERROR:", error);
    return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 });
  }
}

// POST: Create a new Exam Pool
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { eventId, name, examDate, startTime, endTime } = await req.json();

  try {
    const pool = await prisma.examPool.create({
        data: {
            eventId,
            name,
            examDate: new Date(examDate),
            examStartTime: startTime, // "09:00"
            examEndTime: endTime,     // "12:00"
            minCandidates: 25,
            maxCandidates: 28,
            status: 'OPEN'
        }
    });

    return NextResponse.json({ success: true, pool });
  } catch (error) {
    console.error("CREATE_POOL_ERROR:", error);
    return NextResponse.json({ error: 'Failed to create pool' }, { status: 500 });
  }
}
