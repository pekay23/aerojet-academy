import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch my results
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
    if (!student) return NextResponse.json({ results: [] });

    const results = await prisma.assessment.findMany({
      where: { studentId: student.id },
      include: {
        run: { include: { course: true } } // Include exam details
      },
      orderBy: { recordedAt: 'desc' }
    });

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
