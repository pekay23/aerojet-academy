import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return NextResponse.json({ results: [] });

    const results = await prisma.assessment.findMany({
        where: { studentId: student.id },
        orderBy: { recordedAt: 'desc' }
    });

    return NextResponse.json({ results });
  } catch (error) { return NextResponse.json({ error: 'Server Error' }, { status: 500 }); }
}
