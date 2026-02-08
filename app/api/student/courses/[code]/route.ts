import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await params;

  try {
    const course = await prisma.course.findUnique({
        where: { code },
        // Add modules/lessons relation if you have one. 
        // For now, returning basic info.
    });

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    // Mock Lessons (Since we don't have a Lesson table yet)
    const lessons = [
        { id: 1, title: "Introduction to " + course.title, type: "VIDEO", duration: "10 min" },
        { id: 2, title: "Chapter 1: Basics", type: "PDF", duration: "15 pages" },
        { id: 3, title: "Chapter 2: Advanced Concepts", type: "VIDEO", duration: "45 min" },
    ];

    return NextResponse.json({ course, lessons });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
