import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Save Results for a batch of students
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { examRunId, results } = await req.json(); // results: [{ studentId, score }]

  try {
    // 1. Fetch the Exam Run to get the Module Code
    const examRun = await prisma.examRun.findUnique({
      where: { id: examRunId },
      include: { course: true } // Need this for moduleCode
    });

    if (!examRun) {
        return NextResponse.json({ error: 'Exam run not found' }, { status: 404 });
    }

    const moduleCode = examRun.course.code; // e.g. "MOD-01"

    // 2. Process each result in a transaction
    await prisma.$transaction(
        results.map((res: any) => {
            const score = parseFloat(res.score);
            const isPassed = score >= 75; // EASA Standard Pass Mark

            // Update or Create the assessment
            return prisma.assessment.create({
                data: {
                    examRunId,
                    studentId: res.studentId,
                    score,
                    maxScore: 100,
                    isPassed,
                    type: 'EASA_EXAM',
                    moduleCode: moduleCode, // <--- ADDED THIS (Required field)
                    comments: "Exam Run Result"
                }
            });
        })
    );

    // Mark the exam run as COMPLETED
    await prisma.examRun.update({
        where: { id: examRunId },
        data: { status: 'COMPLETED' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Result Save Error:", error);
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
  }
}
