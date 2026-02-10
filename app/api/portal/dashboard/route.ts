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

        let cohort = student.cohort || 'Full-Time';

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
