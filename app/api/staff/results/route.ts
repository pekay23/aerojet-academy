import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

// GET: Fetch Pools available for grading
export async function GET(req: Request) {
  const { error, session } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const poolId = searchParams.get('poolId');

  try {
    if (poolId) {
        // Fetch specific pool roster
        const pool = await prisma.examPool.findUnique({
            where: { id: poolId },
            include: {
                memberships: {
                    include: { student: { include: { user: true } } },
                    orderBy: { student: { user: { name: 'asc' } } }
                }
            }
        });
        
        // Also fetch existing assessments to pre-fill
        const assessments = await prisma.assessment.findMany({
            where: { 
                // We need to link Assessment to Pool or use Module + Student + Date approximation
                // For V1 schema, let's assume we link via 'legacyRunId' or just filter by Student + Module
                // Better: Update Schema to link Assessment -> ExamPool.
                // Workaround: We will create new Assessments.
            }
        });

        return NextResponse.json({ pool });
    } else {
        // Fetch list of pools
        const pools = await prisma.examPool.findMany({
            where: { 
                status: { in: ['CONFIRMED', 'LOCKED', 'COMPLETED'] },
                examDate: { lte: new Date() } // Only past exams
            },
            orderBy: { examDate: 'desc' }
        });
        return NextResponse.json({ pools });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST: Save Grades
export async function POST(req: Request) {
  const { error, session } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  try {
    const { poolId, grades } = await req.json(); // grades = [{ studentId, score, isPassed, comments }]
    
    // Fetch pool to get Module Code
    const pool = await prisma.examPool.findUnique({ where: { id: poolId } });
    if (!pool) return NextResponse.json({ error: 'Pool not found' }, { status: 404 });

    await prisma.$transaction(
        grades.map((g: any) => 
            prisma.assessment.create({
                data: {
                    studentId: g.studentId,
                    moduleCode: g.moduleCode, // Taken from membership
                    score: parseFloat(g.score),
                    isPassed: g.isPassed,
                    type: 'EXAM_POOL',
                    comments: `Pool: ${pool.name}`,
                    legacyRunId: pool.id // Linking to pool ID using the legacy field for now
                }
            })
        )
    );

    // Close the pool
    await prisma.examPool.update({
        where: { id: poolId },
        data: { status: 'COMPLETED' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RESULTS_ERROR:", error);
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
  }
}
