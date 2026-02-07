import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendPaymentConfirmationEmail } from '@/app/lib/mail'; 
import { hash } from 'bcryptjs'; // Import hash

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!['ADMIN', 'STAFF'].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { feeId } = await req.json();

    const fee = await prisma.fee.findUnique({
      where: { id: feeId },
      include: { student: { include: { user: true } } }
    });

    if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 });

    // 1. GENERATE NEW ACCESS CODE (Random 6 chars)
    const accessCode = Math.random().toString(36).slice(-6).toUpperCase();
    const hashedCode = await hash(accessCode, 10);

    await prisma.$transaction(async (tx) => {
      // 2. Mark Fee Paid
      await tx.fee.update({
        where: { id: feeId },
        data: { status: 'PAID', paid: fee.amount }
      });

      // 3. Unlock User & SET NEW PASSWORD
      await tx.user.update({
        where: { id: fee.student.userId },
        data: { 
            isActive: true,
            password: hashedCode // Update DB with new hash
        }
      });

      // 4. Update Status
      if (fee.student.enrollmentStatus === 'PROSPECT') {
          await tx.student.update({
            where: { id: fee.studentId },
            data: { enrollmentStatus: 'APPLICANT' }
          });
      }
    });

    // 5. Send Email with RAW Access Code
    try {
        await sendPaymentConfirmationEmail(
            fee.student.user.email!, 
            fee.student.user.name!,
            accessCode // Pass the raw code to email
        );
    } catch (emailError) {
        console.error("EMAIL_SEND_ERROR:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FINANCE_APPROVE_ERROR:", error);
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
