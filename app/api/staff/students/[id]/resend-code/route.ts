import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';
import { hash } from 'bcryptjs';
import { sendPaymentConfirmationEmail } from '@/app/lib/mail';


export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  // Security: Only Admins can reset passwords/resend codes
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await params; // Student ID (e.g., from URL)

    // 1. Find Student & User
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!student || !student.user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 2. Generate NEW Access Code
    const accessCode = Math.random().toString(36).slice(-6).toUpperCase();
    const hashedPassword = await hash(accessCode, 10);

    // 3. Update Password in DB
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        password: hashedPassword,
        isActive: true // Ensure they are unlocked
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
