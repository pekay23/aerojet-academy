
import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '@/app/lib/auth-helpers';

export async function POST(req: Request) {
    const { error } = await withAuth(['ADMIN']);
    if (error) return error;

    try {
        const { cohortCourseId, instructorIds } = await req.json();

        if (!cohortCourseId) {
            return NextResponse.json({ error: 'Missing cohortCourseId' }, { status: 400 });
        }

        // Ensure instructorIds is an array, even if empty/null
        const ids = Array.isArray(instructorIds) ? instructorIds : [];

        const updated = await prisma.cohortCourse.update({
            where: { id: cohortCourseId },
            data: {
                instructors: {
                    set: ids.map((id: string) => ({ id })) // Replace existing instructors with new list
                }
            },
            include: {
                instructors: {
                    select: { id: true, name: true }
                }
            }
        });

        return NextResponse.json({ success: true, assignment: updated });
    } catch (error) {
        console.error('ASSIGNMENT_UPDATE_ERROR:', error);
        return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
    }
}
