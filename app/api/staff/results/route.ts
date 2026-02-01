import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Save Results for a batch of students
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { examRunId, results } = await req.json(); // results: [{ studentId, score }]

  try {
    const examRun = await prisma.examRun.findUnique({ where: { id: examRunId }, include: { course: true } });
    
    // Process each result
    await prisma.$transaction(
        results.map((res: any) => {
            const isPassed = res.score >= 75; // EASA Standard
            return prisma.assessment.create({
                data: {
                    examRunId,
                    studentId: res.studentId,
                    score: parseFloat(res.score),
                    maxScore: 100,
                    isPassed,
                    type: 'EASA_EXAM'
                }
            });
        })
    );

    // Optional: Mark exam run as COMPLETED
    await prisma.examRun.update({ where: { id: examRunId }, data: { status: 'COMPLETED' } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
  }
}
