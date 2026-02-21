import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function POST(req: Request) {
  const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;

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
        feeType: 'OTHER',
        currency: 'EUR',
        dueDate: new Date()
      }
    });

    return NextResponse.json({ success: true, invoiceId: fee.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
