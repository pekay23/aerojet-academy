import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;

        // Get student profile and registration fee
        const student = await prisma.student.findUnique({
            where: { userId: user.id },
            include: {
                fees: {
                    where: {
                        description: {
                            contains: 'Registration Fee'
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        const fee = student.fees[0] || null;

        return NextResponse.json({ fee });
    } catch (error) {
        console.error('REGISTRATION_FEE_API_ERROR:', error);
        return NextResponse.json({ error: 'Failed to fetch registration fee' }, { status: 500 });
    }
}
