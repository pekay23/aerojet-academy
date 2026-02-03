import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch pending payments (with robust error handling)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check session validity
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Check Role
    const role = (session.user as any).role;
    if (role === 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch Data
    const payments = await prisma.fee.findMany({
      where: { status: 'VERIFYING' },
      include: { 
        student: { 
          include: { user: true } 
        } 
      },
      orderBy: { dueDate: 'desc' }
    });

    // Always return a valid JSON object, even if empty
    return NextResponse.json({ payments: payments || [] });

  } catch (error) {
    console.error("Staff Finance API Error:", error);
    // Return a safe fallback so the frontend doesn't crash
    return NextResponse.json({ payments: [], error: "Server Error" }, { status: 500 });
  }
}

// POST: Confirm payment and update Wallet if applicable
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { feeId, amountPaid } = await req.json(); // Admin sends the actual amount

  try {
    const fee = await prisma.fee.findUnique({ 
        where: { id: feeId },
        include: { student: true }
    });
    if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 });

    const paidAmount = parseFloat(amountPaid);
    const newPaidTotal = fee.paid + paidAmount;
    
    // Determine Status
    let newStatus = 'UNPAID';
    if (newPaidTotal >= fee.amount) newStatus = 'PAID';
    else if (newPaidTotal > 0) newStatus = 'PARTIAL';

    // Check 40% Threshold
    const isDepositThresholdMet = newPaidTotal >= (fee.amount * 0.40);

    await prisma.$transaction(async (tx) => {
        // 1. Update Fee
        await tx.fee.update({
            where: { id: feeId },
            data: { 
                status: newStatus, 
                paid: newPaidTotal 
            }
        });

        // 2. Check for Auto-Enrollment (If 40% threshold met)
        if (isDepositThresholdMet && fee.student.enrollmentStatus !== 'ENROLLED') {
             await tx.student.update({
                where: { id: fee.studentId },
                data: { enrollmentStatus: 'ENROLLED' }
            });
        }
        
        // 3. Bundle Logic (Only if fully paid)
        if (newStatus === 'PAID' && fee.description && fee.description.startsWith('BUNDLE:')) {
            const match = fee.description.match(/\((\d+) Credits\)/);
            if (match && match[1]) {
                const credits = parseInt(match[1]);
                let wallet = await tx.wallet.findUnique({ where: { studentId: fee.studentId } });
                if (!wallet) wallet = await tx.wallet.create({ data: { studentId: fee.studentId, balance: 0 } });
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { increment: credits } }
                });
                await tx.walletTransaction.create({
                    data: { walletId: wallet.id, amount: credits, type: 'PURCHASE', description: `Purchased ${fee.description}` }
                });
            }
        }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Confirmation failed' }, { status: 500 });
  }
}