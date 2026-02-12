import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET(req: Request) {
  const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;
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
