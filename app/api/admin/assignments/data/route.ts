
import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '@/app/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { error } = await withAuth(['ADMIN']);
    if (error) return error;

    try {
        const [intakes, instructors] = await Promise.all([
            prisma.intake.findMany({
                include: {
                    cohorts: {
                        include: {
                            curriculum: {
                                include: {
                                    course: true,
                                    instructors: { // Fetch list of instructors
                                        select: { id: true, name: true }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { name: 'desc' }
            }),
            prisma.user.findMany({
                where: { role: 'INSTRUCTOR', isActive: true, isDeleted: false },
                select: { id: true, name: true, email: true },
                orderBy: { name: 'asc' }
            })
        ]);

        return NextResponse.json({ intakes, instructors });
    } catch (error) {
        console.error('ASSIGNMENT_DATA_ERROR:', error);
        return NextResponse.json({ error: 'Failed to fetch assignment data' }, { status: 500 });
    }
}
