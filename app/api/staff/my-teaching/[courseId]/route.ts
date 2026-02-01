import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  
  // Verify Instructor/Admin
  if (!session || (session.user as any).role === 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { courseId } = await params;

  try {
    // 1. Verify the instructor is assigned to this course (security check)
    // Skip check for ADMIN
    if ((session.user as any).role === 'INSTRUCTOR') {
        const assignment = await prisma.course.findFirst({
            where: {
                id: courseId,
                instructors: { some: { id: session.user.id } }
            }
        });
        if (!assignment) return NextResponse.json({ error: 'Not assigned to this course' }, { status: 403 });
    }

    // 2. Fetch Enrolled Students (Applications with APPROVED status)
    const applications = await prisma.application.findMany({
        where: {
            courseId: courseId,
            status: 'APPROVED'
        },
        include: {
            student: { include: { user: true } }
        },
        orderBy: { student: { user: { name: 'asc' } } }
    });

    const students = applications.map(app => app.student);

    return NextResponse.json({ students });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 });
  }
}
