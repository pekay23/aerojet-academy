import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET(req: Request) {
  const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;

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
