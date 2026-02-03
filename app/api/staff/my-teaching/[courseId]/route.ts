import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> } // Updated to Promise
) {
  const session = await getServerSession(authOptions);
  
  // Verify Instructor/Admin/Staff Role
  if (!session || !['ADMIN', 'STAFF', 'INSTRUCTOR'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Mandatory for Next.js 15: Await the params to get courseId
  const { courseId } = await params;

  try {
    // 1. If the user is an Instructor, verify they are actually teaching this course
    if ((session.user as any).role === 'INSTRUCTOR') {
        const assignment = await prisma.course.findFirst({
            where: {
                id: courseId,
                instructors: { some: { id: session.user.id } }
            }
        });
        if (!assignment) {
          return NextResponse.json({ error: 'Access denied: You are not assigned to this course.' }, { status: 403 });
        }
    }

    // 2. Fetch Enrolled Students (Applications with APPROVED status)
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

    // Extract the student profile data
    const students = applications.map(app => app.student);

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Fetch Instructor Roster Error:", error);
    return NextResponse.json({ error: 'Failed to fetch class roster' }, { status: 500 });
  }
}
