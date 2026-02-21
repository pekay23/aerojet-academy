import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';


export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;

  const { code } = await params;

  try {
    const course = await prisma.course.findUnique({
      where: { code },
      include: {
        // ✅ FETCH REAL LESSONS: Get all related lessons and order them correctly
        lessons: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // The 'lessons' array is now nested inside the 'course' object.
    // The frontend client will access it via 'data.course.lessons'
    return NextResponse.json({ course });

  } catch (error) {
    console.error("GET_COURSE_DETAIL_ERROR:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
