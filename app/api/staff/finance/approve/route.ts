import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { sendPaymentConfirmationEmail, sendPaymentReceiptEmail } from '@/app/lib/mail';
import { hash } from 'bcryptjs';
import { generateInstitutionalEmail } from '@/app/lib/utils';
import { FEE_STATUS } from '@/app/lib/constants';
import { withAuth } from '@/app/lib/auth-helpers';

// Define transaction type since we can't import Prisma.TransactionClient easily in this setup
type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function POST(req: Request) {
  const { error } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

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
    const institutionalEmail = generateInstitutionalEmail(fee.student.user.name!);

    await prisma.$transaction(async (tx: TxClient) => {
      // 3. Mark Fee Paid
      await tx.fee.update({ where: { id: feeId }, data: { status: FEE_STATUS.PAID, paid: fee.amount } });

      // LOGIC MERGE: Handle Registration Fee (Prospect -> Applicant)
      if (fee.description?.toLowerCase().includes('registration') && fee.student.enrollmentStatus === 'PROSPECT') {
        // 4a. Update User: Set Password & Activate
        await tx.user.update({
          where: { id: fee.student.userId },
          data: {
            isActive: true,
            password: hashedCode,
            emailVerified: new Date()
          }
        });

        // 4b. Update Student Status
        await tx.student.update({
          where: { id: fee.studentId },
          data: { enrollmentStatus: 'APPLICANT' }
        });
      }
      // LOGIC MERGE: Handle Course Fee (Applicant -> Student)
      else if (fee.description?.toLowerCase().includes('tuition') || fee.amount.toNumber() > 100) {
        // 4. UPDATE USER: Set New Email & Password & Institutional Email
        await tx.user.update({
          where: { id: fee.student.userId },
          data: {
            isActive: true,
            password: hashedCode,
            email: institutionalEmail,
          }
        });

        // 6. Update Student Profile
        await tx.student.update({
          where: { id: fee.studentId },
          data: {
            enrollmentStatus: 'STUDENT',
            institutionalEmail: institutionalEmail
          }
        });
      }

      // 5. SEND RECEIPT EMAIL (Always)
      await sendPaymentReceiptEmail(
        personalEmail,
        fee.student.user.name!,
        fee.amount.toNumber(),
        fee.description || 'Course Fee',
        fee.id
      );

    }, { maxWait: 20000, timeout: 30000 });

    // 6. Send Email to PERSONAL address
    try {
      await sendPaymentConfirmationEmail(
        personalEmail,
        fee.student.user.name!,
        accessCode,
        institutionalEmail
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
