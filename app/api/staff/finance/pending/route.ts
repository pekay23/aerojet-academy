import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  // Security Check
  if (!['ADMIN', 'STAFF'].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch pending registration fees
    const fees = await prisma.fee.findMany({
      where: {
        status: { in: ['UNPAID', 'PENDING_VERIFICATION'] }, // Adjust based on your schema
        description: { contains: 'Registration' }
      },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, image: true } }
          }
        }
      },
      orderBy: { dueDate: 'desc' }
    });

    return NextResponse.json({ fees });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 });
  }
}
