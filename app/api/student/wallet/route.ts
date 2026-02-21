import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET(req: Request) {
  const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;

  const userId = (session.user as any).id;

  try {
    const student = await prisma.student.findUnique({
        where: { userId },
        include: { 
            wallet: {
                include: {
                    transactions: { orderBy: { createdAt: 'desc' }, take: 20 }
                }
            }
        }
    });

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // Auto-create wallet if missing
    if (!student.wallet) {
        const newWallet = await prisma.wallet.create({
            data: { studentId: student.id }
        });
        return NextResponse.json({ wallet: { ...newWallet, transactions: [] } });
    }

    return NextResponse.json({ wallet: student.wallet });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
