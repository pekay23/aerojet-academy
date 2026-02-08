import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { poolId, moduleCode } = await req.json();

  try {
    const student = await prisma.student.findUnique({
        where: { userId },
        include: { wallet: true }
    });

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // 1. Check Pool Status & Capacity
    const pool = await prisma.examPool.findUnique({
        where: { id: poolId },
        include: { _count: { select: { memberships: true } } }
    });

    if (!pool || ['LOCKED', 'COMPLETED', 'CANCELLED'].includes(pool.status)) {
        return NextResponse.json({ error: 'Pool is not available' }, { status: 400 });
    }

    if (pool._count.memberships >= pool.maxCandidates) {
        return NextResponse.json({ error: 'Pool is full' }, { status: 400 });
    }

    // 2. Check Wallet Balance 
    // PRICE = 300.00 (Decimal)
    const PRICE = new Prisma.Decimal(300.00);

    // Ensure wallet exists and has enough Available Balance
    if (!student.wallet || student.wallet.availableBalance.lt(PRICE)) {
        return NextResponse.json({ error: 'Insufficient wallet balance. Please top up.' }, { status: 402 });
    }

    // 3. Transaction: Deduct Balance, Create Membership
    await prisma.$transaction(async (tx) => {
        // Deduct
        await tx.wallet.update({
            where: { id: student.wallet!.id },
            data: { 
                availableBalance: { decrement: PRICE },
                reservedBalance: { increment: PRICE } // Move to reserved until confirmed
            }
        });

        // Record Transaction
        await tx.walletTransaction.create({
            data: {
                walletId: student.wallet!.id,
                amount: PRICE,
                type: 'RESERVE',
                description: `Reserved seat in ${pool.name} (${moduleCode})`
            }
        });

        // Create Membership
        await tx.poolMembership.create({
            data: {
                poolId,
                studentId: student.id,
                moduleCode,
                pricePaid: PRICE,
                reservedAmount: PRICE,
                status: 'RESERVED'
            }
        });
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("JOIN_POOL_ERROR:", error);
    return NextResponse.json({ error: 'Failed to join pool' }, { status: 500 });
  }
}
