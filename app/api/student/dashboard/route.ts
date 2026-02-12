import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { studentProfile: true }
        });

        if (!user || user.role !== 'STUDENT' || !user.studentProfile) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        const studentId = user.studentProfile.id;

        // 1. Attendance
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: { studentId },
            select: { status: true }
        });

        const totalClasses = attendanceRecords.length;
        const presentClasses = attendanceRecords.filter(r => r.status === 'PRESENT').length;
        const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

        // 2. Active Courses (via Cohort)
        let activeCoursesCount = 0;
        if (user.studentProfile.cohortId) {
            activeCoursesCount = await prisma.cohortCourse.count({
                where: { cohortId: user.studentProfile.cohortId }
            });
        }

        // 3. Next Exam (Pool Membership)
        const nextPool = await prisma.poolMembership.findFirst({
            where: {
                studentId,
                pool: { examDate: { gte: new Date() } }
            },
            include: { pool: true },
            orderBy: { pool: { examDate: 'asc' } }
        });

        let nextExamText = "No upcoming exams";
        if (nextPool) {
            const days = Math.ceil((new Date(nextPool.pool.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            nextExamText = `${days} Days`;
        }

        return NextResponse.json({
            attendance: attendanceRate,
            activeCourses: activeCoursesCount,
            nextExam: nextExamText,
            nextExamDetail: nextPool ? `${nextPool.moduleCode} - ${nextPool.pool.name}` : null
        });

    } catch (error) {
        console.error("STUDENT_DASHBOARD_ERROR:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
