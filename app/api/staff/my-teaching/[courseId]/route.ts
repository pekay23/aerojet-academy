import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error, session } = await withAuth(['INSTRUCTOR', 'ADMIN', 'STAFF']);
  if (error) return error;

  const user = session!.user as { role: string; id: string };
  const { courseId } = await params;

  try {
    // If the user is an Instructor, verify they are actually teaching this course
    if (user.role === 'INSTRUCTOR') {
      const assignment = await prisma.course.findFirst({
        where: {
          id: courseId,
          instructors: { some: { id: user.id } }
        }
      });
      if (!assignment) {
        return NextResponse.json({ error: 'Access denied: You are not assigned to this course.' }, { status: 403 });
      }
    }

    // Fetch Enrolled Students (Applications with APPROVED status)
    const applications = await prisma.application.findMany({
      where: {
        courseId: courseId,
        status: 'APPROVED'
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { student: { user: { name: 'asc' } } }
    });

    const students = applications.map(app => app.student);

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Fetch Instructor Roster Error:", error);
    return NextResponse.json({ error: 'Failed to fetch class roster' }, { status: 500 });
  }
}
