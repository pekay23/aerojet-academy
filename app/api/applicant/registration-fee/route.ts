import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET() {
    try {
        const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;

        const user = session.user as { id: string };

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
