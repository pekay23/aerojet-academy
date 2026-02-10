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

        const user = session.user as any;

        // Ensure user is staff or admin
        // Note: You should have a more robust role check here, but for now we check if they are NOT a student basically
        // Or if your role system supports 'STAFF' / 'ADMIN'
        if (user.role === 'STUDENT' || user.role === 'PROSPECT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const pendingFees = await prisma.fee.findMany({
            where: {
                status: 'PENDING'
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                image: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ fees: pendingFees });

    } catch (error) {
        console.error('GET_PENDING_FEES_ERROR:', error);
        return NextResponse.json({ error: 'Failed to fetch pending fees' }, { status: 500 });
    }
}
