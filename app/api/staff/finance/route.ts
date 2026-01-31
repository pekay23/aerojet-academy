import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch pending payments
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const payments = await prisma.fee.findMany({
    where: { status: 'VERIFYING' },
    include: { student: { include: { user: true } } }
  });

  return NextResponse.json({ payments });
}

// POST: Confirm payment
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { feeId } = await req.json();

  // Mark as PAID and update amount paid
  const fee = await prisma.fee.findUnique({ where: { id: feeId } });
  
  await prisma.fee.update({
    where: { id: feeId },
    data: { 
        status: 'PAID', 
        paid: fee?.amount // Assume full payment for MVP
    }
  });

  return NextResponse.json({ success: true });
}
