import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Join a pool (Reserve Funds)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const { requestedModules } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get Student & Wallet
      const student = await tx.student.findUnique({
        where: { userId: session.user.id },
        include: { wallet: true }
      });
      if (!student?.wallet) throw new Error('Wallet not found');

      // 2. Get Pool
      const pool = await tx.examPool.findUnique({
        where: { id },
        include: { modules: true }
      });
      if (!pool || pool.status !== 'OPEN') throw new Error('Pool unavailable');

      // 3. Check Module Constraint (Max 4 Unique)
      const currentModules = pool.modules.map(m => m.moduleCode);
      const uniqueModules = new Set([...currentModules, ...requestedModules]);
      if (uniqueModules.size > 4) throw new Error('Pool allows max 4 unique modules');

      // 4. Calculate Cost (Simplification: 1 Credit per module)
      const cost = requestedModules.length; 
      if (student.wallet.balance < cost) throw new Error('Insufficient credits');

      // 5. Reserve Funds
      const reservation = await tx.walletReservation.create({
        data: {
          walletId: student.wallet.id,
          amount: cost,
          status: 'ACTIVE',
          purpose: 'POOL_JOIN',
          expiresAt: new Date(Date.now() + 72*60*60*1000)
        }
      });

      await tx.wallet.update({
        where: { id: student.wallet.id },
        data: { balance: { decrement: cost } }
      });

      // 6. Create Participant Record
      await tx.poolParticipant.create({
        data: {
          poolId: id,
          studentId: student.id,
          requestedModules,
          reservationId: reservation.id,
          status: 'SOFT_JOINED'
        }
      });

      // 7. Update Pool Count
      await tx.examPool.update({
        where: { id },
        data: { currentCount: { increment: 1 } }
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE: Cancel Participation (Release Funds)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } });

    await prisma.$transaction(async (tx) => {
      const participant = await tx.poolParticipant.findFirst({
        where: { poolId: id, studentId: student?.id },
        include: { reservation: true }
      });

      if (!participant || participant.status === 'CONFIRMED') throw new Error('Cannot cancel');

      // Refund Wallet
      if (participant.reservation) {
        await tx.wallet.update({
          where: { id: participant.reservation.walletId },
          data: { balance: { increment: participant.reservation.amount } }
        });
        await tx.walletReservation.update({
          where: { id: participant.reservation.id },
          data: { status: 'RELEASED' }
        });
      }

      // Remove Participant
      await tx.poolParticipant.delete({ where: { id: participant.id } });
      await tx.examPool.update({ where: { id }, data: { currentCount: { decrement: 1 } } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
