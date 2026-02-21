import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET(_req: Request) {
  const { error, session } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  try {
    const [applications, prospects] = await Promise.all([
      prisma.application.findMany({
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true, image: true } }
            }
          },
          course: { select: { title: true, code: true } }
        },
        orderBy: { appliedAt: 'desc' }
      }),
      // Fetch prospect students (registered but payment not yet approved)
      prisma.student.findMany({
        where: {
          enrollmentStatus: 'PROSPECT',
          user: { isDeleted: false }
        },
        include: {
          user: { select: { name: true, email: true, image: true, createdAt: true } },
          fees: {
            where: { description: { contains: 'registration', mode: 'insensitive' } },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return NextResponse.json({ applications, prospects });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST: Update Application Status
export async function POST(req: Request) {
  const { error, session } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  try {
    const { id, status } = await req.json();

    const updated = await prisma.application.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
