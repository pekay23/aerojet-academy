import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';


// POST: Add a new note to a student
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await withAuth(['ADMIN', 'STAFF', 'INSTRUCTOR']);
  if (error) return error;

  const user = session!.user as { role: string; id: string };

  try {
    const { id } = await params;
    const { title, content, type } = await req.json();

    const note = await prisma.studentNote.create({
      data: {
        studentId: id,
        authorId: user.id,
        title,
        content,
        type: type || 'GENERAL',
      }
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error("ADD_NOTE_ERROR:", error);
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}
