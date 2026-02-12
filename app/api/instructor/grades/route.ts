import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

// GET: Fetch students + existing grades for a course taught by the instructor
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role: string; id: string } | undefined;

    if (!user || !['INSTRUCTOR', 'ADMIN', 'STAFF'].includes(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
        return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    try {
        // Verify instructor owns this course
        if (user.role === 'INSTRUCTOR') {
            const assignment = await prisma.cohortCourse.findFirst({
                where: { courseId, instructorId: user.id }
            });
            if (!assignment) {
                return NextResponse.json({ error: 'You are not assigned to this course' }, { status: 403 });
            }
        }

        // Get the course info
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, code: true, title: true }
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Get students in cohorts linked to this course
        const cohortCourses = await prisma.cohortCourse.findMany({
            where: {
                courseId,
                ...(user.role === 'INSTRUCTOR' ? { instructorId: user.id } : {})
            },
            include: {
                cohort: {
                    include: {
                        students: {
                            include: {
                                user: { select: { name: true, email: true, image: true } },
                                assessments: {
                                    where: { moduleCode: course.code },
                                    select: {
                                        id: true, score: true, maxScore: true, isPassed: true,
                                        comments: true, recordedAt: true, gradedBy: true, isLocked: true,
                                        moduleCode: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Flatten students from all cohorts
        const students = cohortCourses.flatMap((cc: any) =>
            cc.cohort.students.map((s: any) => ({
                id: s.id,
                studentId: s.studentId,
                name: s.user.name,
                email: s.user.email,
                image: s.user.image,
                existingGrade: s.assessments.length > 0 ? s.assessments[0] : null
            }))
        );

        return NextResponse.json({ course, students });
    } catch (error) {
        console.error("INSTRUCTOR_GRADES_GET_ERROR:", error);
        return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
    }
}

// POST: Submit grades (one-time with isLocked)
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role: string; id: string } | undefined;

    if (!user || !['INSTRUCTOR', 'ADMIN', 'STAFF'].includes(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { courseId, grades } = await req.json();
        // grades = [{ studentId, score, comments? }]

        if (!courseId || !grades?.length) {
            return NextResponse.json({ error: 'courseId and grades are required' }, { status: 400 });
        }

        // Verify instructor owns this course
        if (user.role === 'INSTRUCTOR') {
            const assignment = await prisma.cohortCourse.findFirst({
                where: { courseId, instructorId: user.id }
            });
            if (!assignment) {
                return NextResponse.json({ error: 'You are not assigned to this course' }, { status: 403 });
            }
        }

        // Get the course code for moduleCode
        const course = await prisma.course.findUnique({ where: { id: courseId }, select: { code: true } });
        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Check for already-locked grades
        const existingLockedGrades = await prisma.assessment.findMany({
            where: {
                moduleCode: course.code,
                studentId: { in: grades.map((g: any) => g.studentId) },
                isLocked: true
            },
            select: { studentId: true }
        });

        const lockedStudentIds = new Set(existingLockedGrades.map((g: any) => g.studentId));
        const gradesToCreate = grades.filter((g: any) => !lockedStudentIds.has(g.studentId));

        if (gradesToCreate.length === 0) {
            return NextResponse.json({ error: 'All grades are already locked and cannot be modified' }, { status: 400 });
        }

        const operations = gradesToCreate.map((g: any) =>
            prisma.assessment.create({
                data: {
                    studentId: g.studentId,
                    moduleCode: course.code,
                    score: parseFloat(g.score),
                    maxScore: 100,
                    isPassed: parseFloat(g.score) >= 75,
                    comments: g.comments || null,
                    type: 'INSTRUCTOR_GRADE',
                    gradedBy: user.id,
                    isLocked: true,
                    recordedAt: new Date()
                }
            })
        );

        await prisma.$transaction(operations);

        return NextResponse.json({
            success: true,
            created: gradesToCreate.length,
            skipped: grades.length - gradesToCreate.length
        });
    } catch (error) {
        console.error("INSTRUCTOR_GRADES_POST_ERROR:", error);
        return NextResponse.json({ error: 'Failed to save grades' }, { status: 500 });
    }
}
