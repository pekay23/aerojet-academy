import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  // Security Check
  if (!['ADMIN', 'STAFF'].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all fees that need admin attention:
    // VERIFYING = proof uploaded via public submit-proof route
    // PENDING = proof uploaded via authenticated upload-payment route
    // UNPAID/PARTIAL = still awaiting payment
    const fees = await prisma.fee.findMany({
      where: {
        status: { in: ['VERIFYING', 'PENDING', 'UNPAID', 'PARTIAL'] }
      },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, image: true } }
          }
        }
      },
      orderBy: [
        // Show newest fees first
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ fees });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 });
  }
}
