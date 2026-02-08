import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendPaymentConfirmationEmail } from '@/app/lib/mail'; 
import { hash } from 'bcryptjs';
import { generateInstitutionalEmail } from '@/app/lib/utils'; // Import the helper

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

    // 1. GENERATE NEW CREDENTIALS
    const accessCode = Math.random().toString(36).slice(-6).toUpperCase();
    const hashedCode = await hash(accessCode, 10);
    
    // 2. GENERATE INSTITUTIONAL EMAIL
    const personalEmail = fee.student.user.email!; // Save old email to send notification
    let institutionalEmail = generateInstitutionalEmail(fee.student.user.name!);
    
    // Check uniqueness (if s.hughes exists, maybe append number? Skipping for now based on spec)
    
    await prisma.$transaction(async (tx) => {
      // 3. Mark Fee Paid
      await tx.fee.update({ where: { id: feeId }, data: { status: 'PAID', paid: fee.amount } });

      // 4. UPDATE USER: Set New Email & Password
      await tx.user.update({
        where: { id: fee.student.userId },
        data: { 
            isActive: true,
            password: hashedCode,
            email: institutionalEmail, // 🚀 SWITCH TO ACADEMY EMAIL
        }
      });

      // 5. Update Student Profile
      await tx.student.update({
        where: { id: fee.studentId },
        data: { 
            enrollmentStatus: 'APPLICANT',
            institutionalEmail: institutionalEmail // Save copy here too
        }
      });
    });

    // 6. Send Email to PERSONAL address
    // "Your new Academy Email is X and password is Y"
    try {
        await sendPaymentConfirmationEmail(
            personalEmail, 
            fee.student.user.name!, // <--- FIX: Use this directly, or define const studentName = ...
            accessCode,
            institutionalEmail
        );
;
    } catch (emailError) {
        console.error("EMAIL_SEND_ERROR:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FINANCE_APPROVE_ERROR:", error);
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
