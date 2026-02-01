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
  
  if (!session || (session.user as any).role === 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { feeId } = await req.json();
    
    const fee = await prisma.fee.findUnique({ where: { id: feeId } });
    if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 });

    // Transaction: Update Fee AND potentially update Wallet
    await prisma.$transaction(async (tx) => {
    // 1. Mark Fee as Paid
    await tx.fee.update({
        where: { id: feeId },
        data: { status: 'PAID', paid: fee.amount }
    });

    // 2. AUTO-ENROLL LOGIC
    // Check if this payment was a Seat Deposit
    if (fee.description && fee.description.toLowerCase().includes('seat deposit')) {
        await tx.student.update({
            where: { id: fee.studentId },
            data: { 
                enrollmentStatus: 'ENROLLED',
                // You can also set the cohort here if known
            }
        });
    }

        // 3. Check if it's a Bundle Purchase
        if (fee.description && fee.description.startsWith('BUNDLE:')) {
            // Extract credits (Format: "BUNDLE: Name (X Credits)")
            const match = fee.description.match(/\((\d+) Credits\)/);
            if (match && match[1]) {
                const credits = parseInt(match[1]);

                // Find or Create Wallet
                let wallet = await tx.wallet.findUnique({ where: { studentId: fee.studentId } });
                if (!wallet) {
                    wallet = await tx.wallet.create({ data: { studentId: fee.studentId, balance: 0 } });
                }

                // Add Credits
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { increment: credits } }
                });

                // Log Transaction
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: credits,
                        type: 'PURCHASE',
                        description: `Purchased ${fee.description}`
                    }
                });
            }
        }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    return NextResponse.json({ error: 'Confirmation failed' }, { status: 500 });
  }
}
