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
    const student = await prisma.student.findUnique({
        where: { userId },
        include: {
            cohortRel: { // Get courses via Cohort
                include: {
                    curriculum: {
                        include: { course: true }
                    }
                }
            },
            // OR Get courses via direct enrollment (if you have that model)
            // For now, let's assume Cohort-based curriculum
        }
    });

    if (!student || !student.cohortRel) {
        return NextResponse.json({ courses: [] }); // No cohort = No courses
    }

    // Transform data for UI
    const courses = student.cohortRel.curriculum.map(c => ({
        id: c.course.id,
        code: c.course.code,
        title: c.course.title,
        semester: c.semester,
        progress: 0, // Placeholder for now (needs Attendance/Grades logic)
        nextLesson: "Monday 9:00 AM" // Placeholder
    }));

    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
