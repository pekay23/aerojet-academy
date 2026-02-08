import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
