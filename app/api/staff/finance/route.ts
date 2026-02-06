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
    
    if (!session || !session.user || (session.user as any).role === 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const payments = await prisma.fee.findMany({
      where: { status: 'VERIFYING' }, // This is correct.
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
    
    const fee = await prisma.fee.findUnique({ 
        where: { id: feeId },
        include: { student: { include: { user: true } } }
    });

    if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 });

    const paidAmount = parseFloat(amountPaid);
    const newPaidTotal = fee.paid + paidAmount;
    
    let newStatus = 'PARTIAL';
    if (newPaidTotal >= fee.amount) newStatus = 'PAID';
    
    // Check 40% Threshold for Auto-Enrollment on Tuition (not just any fee)
    const isTuition = fee.description?.toLowerCase().includes('tuition');
    const isDepositThresholdMet = isTuition && newPaidTotal >= (fee.amount * 0.40);
    
    await prisma.$transaction(async (tx) => {
        // A. Update the Fee Record
        await tx.fee.update({
            where: { id: feeId },
            data: { 
                status: newStatus, 
                paid: newPaidTotal 
            }
        });

        // B. Activate user account if Registration Fee is paid
        if (fee.description?.includes('Registration Fee') && newStatus === 'PAID') {
            await tx.user.update({
                where: { id: fee.student.userId },
                data: { isActive: true }
            });
        }
        
        // C. Handle Auto-Enrollment for Tuition
        if (isDepositThresholdMet && fee.student.enrollmentStatus !== 'ENROLLED') {
             await tx.student.update({
                where: { id: fee.studentId },
                data: { enrollmentStatus: 'ENROLLED' }
            });
        }
        
        // D. Handle Bundle/Wallet Credits
        if (newStatus === 'PAID' && fee.description?.startsWith('BUNDLE:')) {
            const match = fee.description.match(/\((\d+) Credits\)/);
            if (match?.[1]) {
                const credits = parseInt(match[1]);
                const wallet = await tx.wallet.upsert({
                    where: { studentId: fee.studentId },
                    update: { balance: { increment: credits } },
                    create: { studentId: fee.studentId, balance: credits }
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

    // 3. TRIGGER NOTIFICATION
    const studentEmail = fee.student.user.email;
    const studentName = fee.student.user.name || "Student";
    if (studentEmail) {
        try {
            await sendPaymentVerifiedEmail(studentEmail, studentName);
        } catch (emailError) {
            console.error("Notification Email Failed:", emailError);
        }
    }
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Confirm Payment POST Error:", error);
    return NextResponse.json({ error: 'Confirmation failed' }, { status: 500 });
  }
}
