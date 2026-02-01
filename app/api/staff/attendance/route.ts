import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Record Attendance for a list of students
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { courseId, date, records } = await req.json(); // records: [{ studentId, attended, scheduled, late }]

  try {
    // Transactional save
    await prisma.$transaction(
        records.map((rec: any) => 
            prisma.attendanceRecord.create({
                data: {
                    courseId,
                    date: new Date(date),
                    studentId: rec.studentId,
                    scheduledHours: parseFloat(rec.scheduled),
                    attendedHours: parseFloat(rec.attended),
                    lateMinutes: parseInt(rec.late || 0),
                    recordedBy: session.user.id
                }
            })
        )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record' }, { status: 500 });
  }
}

// GET: Fetch attendance stats for a specific student (for the profile/dashboard)
// We'll create a separate endpoint for the Staff View later (or query via existing)
