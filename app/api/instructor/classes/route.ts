import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

// GET: Fetch classes assigned to the current instructor
export async function GET() {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role: string; id: string } | undefined;

    if (!user || !['INSTRUCTOR', 'ADMIN', 'STAFF'].includes(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        // For instructors, fetch only their assigned classes via CohortCourse
        const instructorFilter = user.role === 'INSTRUCTOR' ? { instructors: { some: { id: user.id } } } : {};

        const classes = await prisma.cohortCourse.findMany({
            where: instructorFilter,
            include: {
                course: {
                    select: { id: true, code: true, title: true, description: true, duration: true }
                },
                cohort: {
                    select: {
                        id: true, name: true, code: true,
                        students: {
                            select: {
                                id: true,
                                studentId: true,
                                user: { select: { name: true, email: true, image: true } }
                            }
                        },
                        _count: { select: { students: true } }
                    }
                }
            },
            orderBy: { course: { code: 'asc' } }
        });

        // Also fetch recent attendance summary per class
        const classesWithStats = await Promise.all(
            classes.map(async (cls: any) => {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const attendanceRecords = await prisma.attendanceRecord.count({
                    where: {
                        courseId: cls.courseId,
                        date: { gte: thirtyDaysAgo },
                        ...(user.role === 'INSTRUCTOR' ? { recordedBy: user.id } : {})
                    }
                });
                const presentRecords = await prisma.attendanceRecord.count({
                    where: {
                        courseId: cls.courseId,
                        date: { gte: thirtyDaysAgo },
                        status: 'PRESENT',
                        ...(user.role === 'INSTRUCTOR' ? { recordedBy: user.id } : {})
                    }
                });

                return {
                    id: cls.id,
                    courseId: cls.course.id,
                    courseCode: cls.course.code,
                    courseTitle: cls.course.title,
                    courseDescription: cls.course.description,
                    courseDuration: cls.course.duration,
                    cohortId: cls.cohort.id,
                    cohortName: cls.cohort.name,
                    cohortCode: cls.cohort.code,
                    studentCount: cls.cohort._count.students,
                    students: cls.cohort.students,
                    semester: cls.semester,
                    attendanceRate: attendanceRecords > 0
                        ? Math.round((presentRecords / attendanceRecords) * 100)
                        : null
                };
            })
        );

        return NextResponse.json({ classes: classesWithStats });
    } catch (error) {
        console.error("INSTRUCTOR_CLASSES_ERROR:", error);
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }
}
