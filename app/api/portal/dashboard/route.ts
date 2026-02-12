import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET(_req: Request) {
    try {
        const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;

        const userId = (session.user as { id: string }).id;

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

        const cohort = student.cohort || 'Full-Time';

        return NextResponse.json({
            name: student.user.name,
            email: student.user.email,
            enrollmentStatus: student.enrollmentStatus,
            cohort: cohort,
            application: student.applications[0] || null,
            fees: student.fees,
        });

    } catch (error) {
        console.error('GET_DASHBOARD_ERROR:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
