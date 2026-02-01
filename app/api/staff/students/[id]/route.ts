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

  // Destructure all possible fields an admin might update
  const { studentId, photoUrl, enrollmentStatus, cohort } = body;

  try {
    const student = await prisma.student.update({
      where: { id },
      data: {
        studentId: studentId || undefined,
        photoUrl: photoUrl || undefined,
        enrollmentStatus: enrollmentStatus || undefined,
        cohort: cohort || undefined,
      }
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error("Update Student Error:", error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    // 1. Find student to get the linked userId
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // 2. Delete User (Student profile will delete automatically due to Cascade)
    await prisma.user.delete({
      where: { id: student.userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}