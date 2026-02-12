import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

export async function GET(_req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const courses = await prisma.course.findMany({
            select: {
                id: true,
                code: true,
                title: true,
                description: true,
                duration: true,
                price: true,
                materialLink: false, // Don't expose this until enrolled
            }
        });

        return NextResponse.json({ courses });
    } catch (_error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
