import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET(_req: Request) {
    const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;

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
