import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import crypto from 'crypto';
import { hash } from 'bcryptjs';
import { sendPaymentConfirmationEmail } from '@/app/lib/mail';
import { withAuth } from '@/app/lib/auth-helpers';


export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withAuth(['ADMIN']);
  if (error) return error;

  try {
    const { id } = await params;

    // 1. Find Student & User
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!student || !student.user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 2. Generate NEW Access Code (cryptographically secure)
    const accessCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const hashedPassword = await hash(accessCode, 10);

    // 3. Update Password in DB
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        password: hashedPassword,
        isActive: true
      }
    });

    // 4. Resend Email
    try {
      await sendPaymentConfirmationEmail(
        student.user.email!,
        student.user.name!,
        accessCode
      );
    } catch (emailError) {
      console.error("EMAIL_RESEND_ERROR:", emailError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Access code reset and sent.' });

  } catch (error) {
    console.error("RESEND_CODE_ERROR:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
