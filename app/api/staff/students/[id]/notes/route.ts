import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Add a new note to a student
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAFF', 'INSTRUCTOR'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { title, content, type } = await req.json();

    const note = await prisma.studentNote.create({
      data: {
        studentId: id,
        authorId: session.user.id,
        title,
        content,
        type, // DISCIPLINARY, ACADEMIC, GENERAL
      }
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}
