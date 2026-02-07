import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Confirm Pool (Capture Funds & Create Exams)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    
    await prisma.$transaction(async (tx) => {
      const pool = await tx.examPool.findUnique({
        where: { id },
        include: { participants: { include: { reservation: true } } }
      });

      if (!pool || pool.currentCount < pool.minCandidates) throw new Error('Pool not ready');

      // 1. Capture All Reservations
      for (const p of pool.participants) {
        if (p.reservation && p.reservation.status === 'ACTIVE') {
          await tx.walletReservation.update({
            where: { id: p.reservation.id },
            data: { status: 'CAPTURED', capturedAt: new Date() }
          });
        }
        // Update Participant Status
        await tx.poolParticipant.update({
          where: { id: p.id },
          data: { status: 'CONFIRMED' }
        });
      }

      // 2. Update Pool Status
      await tx.examPool.update({
        where: { id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() }
      });
      
      // (Optional: Logic to create actual ExamRun records here)
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT: Fail Pool (Refund Everyone)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // ... (Auth checks same as above) ...
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await params;
    await prisma.$transaction(async (tx) => {
      const pool = await tx.examPool.findUnique({
        where: { id },
        include: { participants: { include: { reservation: true } } }
      });

      // Refund everyone
      for (const p of pool?.participants || []) {
        if (p.reservation?.status === 'ACTIVE') {
          await tx.wallet.update({
            where: { id: p.reservation.walletId },
            data: { balance: { increment: p.reservation.amount } }
          });
          await tx.walletReservation.update({ where: { id: p.reservation.id }, data: { status: 'RELEASED' } });
        }
      }

      await tx.examPool.update({ where: { id }, data: { status: 'FAILED' } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
