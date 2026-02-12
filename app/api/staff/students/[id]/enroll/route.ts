import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';


export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!['ADMIN', 'STAFF'].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await params; // Student ID
    const { cohortId, status } = await req.json();

    // Verify Cohort exists
    const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

    // Update Student
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        cohortId,
        enrollmentStatus: status || 'ENROLLED',
        cohort: cohort.name // Update legacy string field if needed
      }
    });

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error("ENROLL_ERROR:", error);
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
  }
}
