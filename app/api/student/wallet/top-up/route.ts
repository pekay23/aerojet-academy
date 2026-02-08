import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { amount } = await req.json();

  try {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // Create a Fee Invoice
    const fee = await prisma.fee.create({
        data: {
            studentId: student.id,
            amount: amount,
            status: 'UNPAID', // or VERIFYING if they upload proof immediately
            description: `Wallet Top-Up: ${amount} Credits`,
            dueDate: new Date()
        }
    });

    return NextResponse.json({ success: true, invoiceId: fee.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
