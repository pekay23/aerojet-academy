import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { sendPaymentVerifiedEmail } from '@/app/lib/mail';

const prisma = new PrismaClient();

// GET: Fetch pending payments (Status: VERIFYING)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role === 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const payments = await prisma.fee.findMany({
      where: { status: 'VERIFYING' },
      include: { 
        student: { 
          include: { user: true } 
        } 
      },
      orderBy: { dueDate: 'desc' }
    });

    return NextResponse.json({ payments: payments || [] });

  } catch (error) {
    console.error("Staff Finance GET Error:", error);
    return NextResponse.json({ payments: [], error: "Server Error" }, { status: 500 });
  }
}

// POST: Confirm payment amount, update Status, Wallet, and notify Student
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role === 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { feeId, amountPaid } = await req.json();

    // 1. Fetch fee details along with student and auth user info
    const fee = await prisma.fee.findUnique({ 
        where: { id: feeId },
        include: { 
            student: { 
                include: { user: true } 
            } 
        }
    });

    if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 });

    const paidAmount = parseFloat(amountPaid);
    const newPaidTotal = fee.paid + paidAmount;
    
    // Determine New Status
    let newStatus = 'UNPAID';
    if (newPaidTotal >= fee.amount) newStatus = 'PAID';
    else if (newPaidTotal > 0) newStatus = 'PARTIAL';

    // Check 40% Threshold for Auto-Enrollment
    const isDepositThresholdMet = newPaidTotal >= (fee.amount * 0.40);

    // 2. Execute Database Transaction
    await prisma.$transaction(async (tx) => {
        // A. Update the Fee Record
        await tx.fee.update({
            where: { id: feeId },
            data: { 
                status: newStatus, 
                paid: newPaidTotal 
            }
        });

        // B. Handle Auto-Enrollment
        if (isDepositThresholdMet && fee.student.enrollmentStatus !== 'ENROLLED') {
             await tx.student.update({
                where: { id: fee.studentId },
                data: { enrollmentStatus: 'ENROLLED' }
            });
        }
        
        // C. Handle Bundle/Wallet Credits (Only if fully paid)
        if (newStatus === 'PAID' && fee.description && fee.description.startsWith('BUNDLE:')) {
            const match = fee.description.match(/\((\d+) Credits\)/);
            if (match && match[1]) {
                const credits = parseInt(match[1]);
                let wallet = await tx.wallet.findUnique({ where: { studentId: fee.studentId } });
                if (!wallet) {
                    wallet = await tx.wallet.create({ data: { studentId: fee.studentId, balance: 0 } });
                }
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { increment: credits } }
                });
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

    // 3. TRIGGER NOTIFICATION: Send email to student
    // We use the email from the linked User account
    const studentEmail = fee.student.user.email;
    const studentName = fee.student.user.name || "Student";

    if (studentEmail) {
        try {
            await sendPaymentVerifiedEmail(studentEmail, studentName);
        } catch (emailError) {
            console.error("Notification Email Failed:", emailError);
            // We don't fail the whole request if just the email fails
        }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Confirm Payment POST Error:", error);
    return NextResponse.json({ error: 'Confirmation failed' }, { status: 500 });
  }
}
