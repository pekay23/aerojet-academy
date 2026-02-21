import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET(req: Request) {
  const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;

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
