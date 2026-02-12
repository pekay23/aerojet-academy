import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, Prisma } from '@prisma/client';
import { sendPaymentConfirmationEmail } from '@/app/lib/mail';

// GET: Fetch pending payments (Status: VERIFYING)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user as any).role === 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const payments = await prisma.fee.findMany({
      where: { status: 'VERIFYING' },
      include: { 
        student: { 
          include: { 
            user: { 
              select: { 
                name: true, 
                email: true, 
                image: true 
              } 
            } 
          } 
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

// POST: Confirm payment amount
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

    // Handle Decimal Arithmetic using Prisma.Decimal
    const paidAmount = new Prisma.Decimal(amountPaid);
    const newPaidTotal = fee.paid.add(paidAmount);
    
    let newStatus = 'PARTIAL';
    if (newPaidTotal.gte(fee.amount)) newStatus = 'PAID';
    
    await prisma.$transaction(async (tx) => {
        // 1. Update Fee
        await tx.fee.update({
            where: { id: feeId },
            data: { 
                status: newStatus, 
                paid: newPaidTotal 
            }
        });

        // 2. Handle Registration Fee (Unlock User)
        if (fee.description?.includes('Registration Fee') && newStatus === 'PAID') {
            await tx.user.update({
                where: { id: fee.student.userId },
                data: { isActive: true }
            });
            await tx.student.update({
                where: { id: fee.student.id },
                data: { enrollmentStatus: 'APPLICANT' }
            });
        }
        
        // 3. Handle Tuition Deposit (40%)
        const isTuition = fee.description?.toLowerCase().includes('tuition');
        const depositThreshold = fee.amount.mul(0.40);
        
        if (isTuition && newPaidTotal.gte(depositThreshold) && fee.student.enrollmentStatus !== 'ENROLLED') {
             await tx.student.update({
                where: { id: fee.student.id },
                data: { enrollmentStatus: 'ENROLLED' }
            });
        }
        
        // 4. Handle Bundle/Wallet Credits
        if (newStatus === 'PAID' && fee.description?.startsWith('BUNDLE:')) {
            const match = fee.description.match(/\((\d+) Credits\)/);
            if (match?.[1]) {
                const credits = parseInt(match[1]);
                const creditDecimal = new Prisma.Decimal(credits);

                const wallet = await tx.wallet.upsert({
                  where: { studentId: fee.studentId },
                  update: { 
                      availableBalance: { increment: creditDecimal } // Update availableBalance
                  },
                  create: { 
                      studentId: fee.studentId, 
                      availableBalance: creditDecimal, // Set availableBalance
                      reservedBalance: new Prisma.Decimal(0) // Initialize reserved
                  }
              });
                await tx.walletTransaction.create({
                    data: { 
                        walletId: wallet.id, 
                        amount: creditDecimal, 
                        type: 'PURCHASE', // 'TOP_UP' might be better
                        description: `Purchased ${fee.description}` 
                    }
                });
            }
        }
    });

    // 5. Send Notification
    const studentEmail = fee.student.user.email;
    const studentName = fee.student.user.name || "Student";

    if (studentEmail) {
        try {
            await sendPaymentConfirmationEmail(studentEmail, studentName);
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
