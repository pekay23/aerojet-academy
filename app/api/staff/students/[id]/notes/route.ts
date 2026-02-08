import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Add a new note to a student
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  // 1. Security Check
  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id; // Ensure we get the ID

  if (!session || !['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!userId) {
    return NextResponse.json({ error: 'User ID missing in session' }, { status: 400 });
  }

  try {
    const { id } = await params;
    const { title, content, type } = await req.json();

    const note = await prisma.studentNote.create({
      data: {
        studentId: id,
        authorId: userId, // Use the extracted ID
        title,
        content,
        type: type || 'GENERAL', // Default fallback
      }
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error("ADD_NOTE_ERROR:", error);
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}
