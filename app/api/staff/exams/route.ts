import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

// GET: Fetch all Exam Pools (Replaces Runs)
export async function GET(req: Request) {
  const { error, session } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

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
  const { error, session } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

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
