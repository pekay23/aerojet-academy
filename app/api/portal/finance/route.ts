import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) return NextResponse.json({ fees: [], balance: 0 });

    // Fetch all fees linked to this student
    const fees = await prisma.fee.findMany({
      where: { studentId: student.id },
      orderBy: { dueDate: 'desc' }
    });

    // Calculate total outstanding balance
    const balance = fees.reduce((acc, fee) => {
        if (fee.status !== 'CLEARED' && fee.status !== 'PAID') {
            return acc + (fee.amount - fee.paid);
        }
        return acc;
    }, 0);

    return NextResponse.json({ fees, balance });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 });
  }
}
