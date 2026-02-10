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

        const userId = (session.user as any).id;

        const student = await prisma.student.findUnique({
            where: { userId },
            include: {
                user: true,
                applications: {
                    orderBy: { appliedAt: 'desc' },
                    take: 1
                },
                fees: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        // Determine Cohort Context or mock it if missing
        // For dashboard logic, we need to know if they are Exam Only or Full Time based on recent application or existing cohort
        let cohort = student.cohort || 'Full-Time'; // Default

        // If they have an application, use that program preference
        // The Application model has courseId, but wizard sends 'program' string usually stored where?
        // Our Application model links to Course.
        // The wizard sends 'program' in body. The POST endpoint handles it.
        // Let's assume 'Full-Time' is default unless specified.

        return NextResponse.json({
            name: student.user.name,
            email: student.user.email,
            enrollmentStatus: student.enrollmentStatus,
            cohort: cohort,
            application: student.applications[0] || null,
            fees: student.fees,
            // Add any other specific fields needed by dashboard
        });

    } catch (error) {
        console.error('GET_DASHBOARD_ERROR:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
