import { NextResponse } from 'next/server';
import { sendRegistrationInvoiceEmail } from '@/app/lib/mail';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, name, phone, programme, sourceId } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 });
    }

    // 2. Generate a secure placeholder password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hash(tempPassword, 10);

    // 3. TRANSACTION: Create User, Student Profile, and Registration Fee all at once
    await prisma.$transaction(async (tx) => {
      // A. Create the User account
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          isActive: false, // User is locked until payment is verified
        }
      });

      // B. Create the linked Student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          phone: phone || null,
          enrollmentStatus: 'APPLICANT',
          cohort: programme || 'General Intake'
        }
      });

      // C. CRITICAL STEP: Create the initial invoice for this student
      await tx.fee.create({
        data: {
          studentId: student.id,
          amount: 350.00,
          status: 'UNPAID',
          description: `Registration Fee (${programme || 'General'})`,
          dueDate: new Date(),
        }
      });
    });

    // 4. Send the invoice email to the new applicant
    await sendRegistrationInvoiceEmail(email, name);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Registration Process Error:", error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
