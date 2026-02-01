import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch single student details
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        applications: { include: { course: true } },
        fees: true,
        examBookings: { include: { run: { include: { course: true } } } }
      }
    });
    return NextResponse.json({ student });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// PATCH: Update Student ID OR Photo
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  const { id } = await params;

  // We might receive studentId OR photoUrl
  const { studentId, photoUrl } = body;

  try {
    const dataToUpdate: any = {};
    
    if (studentId) {
        // Check uniqueness logic... (keep existing logic)
        const existing = await prisma.student.findUnique({ where: { studentId } });
        if (existing && existing.id !== id) return NextResponse.json({ error: 'ID already taken' }, { status: 400 });
        dataToUpdate.studentId = studentId;
    }

    if (photoUrl) {
        dataToUpdate.photoUrl = photoUrl;
    }

    await prisma.student.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
