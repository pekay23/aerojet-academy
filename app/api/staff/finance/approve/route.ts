import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// 👇 1. IMPORT THE NEW FUNCTION
import { sendPaymentConfirmationEmail } from '@/app/lib/mail'; 

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!['ADMIN', 'STAFF'].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { feeId } = await req.json();

    // Fetch Fee with Student AND User info (Need email/name)
    const fee = await prisma.fee.findUnique({
      where: { id: feeId },
      include: { 
        student: {
          include: { user: true } // ✅ Need User to get email
        } 
      }
    });

    if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // ... (Transaction logic stays the same: Update Fee, Unlock User, Update Student) ...
      await tx.fee.update({
        where: { id: feeId },
        data: { status: 'PAID', paid: fee.amount }
      });

      await tx.user.update({
        where: { id: fee.student.userId },
        data: { isActive: true }
      });

      if (fee.student.enrollmentStatus === 'PROSPECT') {
          await tx.student.update({
            where: { id: fee.studentId },
            data: { enrollmentStatus: 'APPLICANT' }
          });
      }
    });

    // 👇 2. SEND THE EMAIL (After transaction succeeds)
    try {
        await sendPaymentConfirmationEmail(
            fee.student.user.email!, 
            fee.student.user.name!
        );
    } catch (emailError) {
        console.error("EMAIL_SEND_ERROR:", emailError);
        // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FINANCE_APPROVE_ERROR:", error);
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
