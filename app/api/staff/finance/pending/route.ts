
import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '@/app/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { error } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  try {
    const fees = await prisma.fee.findMany({
      where: {
        status: { in: ['VERIFYING', 'PENDING', 'UNPAID', 'PARTIAL'] }
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

    return NextResponse.json({ fees });
  } catch (error) {
    console.error('PENDING_FEES_ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 });
  }
}
