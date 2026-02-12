import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    // 1. Get Student ID
    const student = await prisma.student.findUnique({
        where: { userId },
        select: { id: true }
    });

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // 2. Fetch OPEN Events
    const events = await prisma.examEvent.findMany({
        where: { 
            status: { in: ['OPEN', 'CONFIRMED'] },
            endDate: { gt: new Date() }
        },
        include: {
            pools: {
                orderBy: { examDate: 'asc' },
                include: {
                    // Check if THIS student is already in the pool
                    memberships: {
                        where: { studentId: student.id }
                    },
                    // Get count of confirmed people
                    _count: {
                        select: { memberships: true }
                    }
                }
            }
        },
        orderBy: { startDate: 'asc' }
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("FETCH_POOLS_ERROR:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
