import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

// GET: Fetch courses assigned to the current instructor
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  // Allow Instructors (and Admins/Staff for testing)
  if (!session || !['INSTRUCTOR', 'ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const courses = await prisma.course.findMany({
      where: {
        instructors: {
          some: {
            id: session.user.id
          }
        }
      },
      orderBy: { code: 'asc' }
    });

    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
