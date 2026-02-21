import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

// GET: Fetch courses assigned to the current instructor
export async function GET(req: Request) {
  const { error, session } = await withAuth(['INSTRUCTOR', 'ADMIN', 'STAFF']);
  if (error) return error;

  const user = session!.user as { role: string; id: string };

  try {
    const courses = await prisma.course.findMany({
      where: {
        instructors: {
          some: {
            id: user.id
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
