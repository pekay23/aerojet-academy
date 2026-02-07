import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true, 
        applications: { where: { status: 'APPROVED' }, include: { course: true } },
        examBookings: { include: { run: { include: { course: true } } } },
        attendance: true
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const totalLessons = student.attendance.length || 1;
    const attendedLessons = student.attendance.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = Math.round((attendedLessons / totalLessons) * 100);

    // Filter upcoming exams in JS to avoid complex Prisma date logic inside include
    const upcomingExams = student.examBookings.filter(b => 
      new Date(b.run.startDatetime) > new Date()
    );

    return NextResponse.json({
      name: student.user.name,
      enrollmentStatus: student.enrollmentStatus,
      cohort: student.cohort, // Required for dashboard logic
      enrolledCourses: student.applications.map(app => app.course),
      upcomingExams: upcomingExams,
      attendanceRate
    });

  } catch (error) {
    console.error("Student Dashboard API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
