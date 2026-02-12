import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

// GET: Fetch attendance records for instructor's courses
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role: string; id: string } | undefined;

    if (!user || !['INSTRUCTOR', 'ADMIN', 'STAFF'].includes(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const dateStr = searchParams.get('date');

    if (!courseId) {
        return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    try {
        // Verify instructor owns this course
        if (user.role === 'INSTRUCTOR') {
            const assignment = await prisma.cohortCourse.findFirst({
                where: { courseId, instructors: { some: { id: user.id } } }
            });
            if (!assignment) {
                return NextResponse.json({ error: 'You are not assigned to this course' }, { status: 403 });
            }
        }

        // Get students enrolled in this course's cohort
        const cohortCourse = await prisma.cohortCourse.findFirst({
            where: {
                courseId,
                ...(user.role === 'INSTRUCTOR' ? { instructors: { some: { id: user.id } } } : {})
            },
            include: {
                cohort: {
                    include: {
                        students: {
                            include: { user: { select: { name: true, email: true, image: true } } }
                        }
                    }
                },
                course: { select: { code: true, title: true } }
            }
        });

        if (!cohortCourse) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Fetch attendance records for the given date
        let dateFilter: any = {};
        if (dateStr) {
            const date = new Date(dateStr);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            dateFilter = { date: { gte: date, lt: nextDay } };
        }

        const records = await prisma.attendanceRecord.findMany({
            where: {
                courseId,
                ...dateFilter
            },
            include: {
                student: { include: { user: { select: { name: true } } } }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json({
            course: cohortCourse.course,
            students: cohortCourse.cohort.students,
            records
        });
    } catch (error) {
        console.error("INSTRUCTOR_ATTENDANCE_GET_ERROR:", error);
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }
}

// POST: Create/update attendance records (bulk)
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role: string; id: string } | undefined;

    if (!user || !['INSTRUCTOR', 'ADMIN', 'STAFF'].includes(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { courseId, date, records } = await req.json();
        // records = [{ studentId, status, comment? }]

        if (!courseId || !date || !records?.length) {
            return NextResponse.json({ error: 'courseId, date, and records are required' }, { status: 400 });
        }

        // Verify instructor owns this course
        if (user.role === 'INSTRUCTOR') {
            const assignment = await prisma.cohortCourse.findFirst({
                where: { courseId, instructors: { some: { id: user.id } } }
            });
            if (!assignment) {
                return NextResponse.json({ error: 'You are not assigned to this course' }, { status: 403 });
            }
        }

        const attendanceDate = new Date(date);

        // Upsert each record
        const operations = records.map((r: any) =>
            prisma.attendanceRecord.upsert({
                where: {
                    id: r.existingId || 'non-existent-id' // Force create if no existing ID
                },
                update: {
                    status: r.status,
                    comment: r.comment || null,
                    recordedBy: user.id
                },
                create: {
                    courseId,
                    studentId: r.studentId,
                    date: attendanceDate,
                    status: r.status,
                    comment: r.comment || null,
                    type: 'DAILY',
                    recordedBy: user.id
                }
            })
        );

        await prisma.$transaction(operations);

        return NextResponse.json({ success: true, count: records.length });
    } catch (error) {
        console.error("INSTRUCTOR_ATTENDANCE_POST_ERROR:", error);
        return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
    }
}

// PUT: Edit individual attendance record
export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role: string; id: string } | undefined;

    if (!user || !['INSTRUCTOR', 'ADMIN', 'STAFF'].includes(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { recordId, status, comment } = await req.json();

        if (!recordId || !status) {
            return NextResponse.json({ error: 'recordId and status are required' }, { status: 400 });
        }

        const record = await prisma.attendanceRecord.findUnique({ where: { id: recordId } });
        if (!record) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        // Verify instructor owns this course
        if (user.role === 'INSTRUCTOR') {
            const assignment = await prisma.cohortCourse.findFirst({
                where: { courseId: record.courseId, instructors: { some: { id: user.id } } }
            });
            if (!assignment) {
                return NextResponse.json({ error: 'You are not assigned to this course' }, { status: 403 });
            }
        }

        const updated = await prisma.attendanceRecord.update({
            where: { id: recordId },
            data: { status, comment: comment || null, recordedBy: user.id }
        });

        return NextResponse.json({ success: true, record: updated });
    } catch (error) {
        console.error("INSTRUCTOR_ATTENDANCE_PUT_ERROR:", error);
        return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
    }
}
