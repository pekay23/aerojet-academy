import { NextResponse } from 'next/server';
import { sendRegistrationInvoiceEmail } from '@/app/lib/mail';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, name, phone, programme } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    // 2. Generate a secure placeholder password
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
    const hashedPassword = await hash(tempPassword, 10);

    // 3. TRANSACTION: Create User, Profile, and Fee
    // Added options to prevent the 5000ms timeout
    await prisma.$transaction(async (tx) => {
      // A. Create User account
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          isActive: false, // User is locked until payment is verified
        }
      });

      // B. Create linked Student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          phone: phone || null,
          enrollmentStatus: 'PROSPECT',
          cohort: programme || 'General Intake'
        }
      });

      // C. Create the Registration Fee Invoice
      await tx.fee.create({
        data: {
          studentId: student.id,
          amount: 350.00,
          status: 'UNPAID',
          description: `Registration Fee (${programme || 'General'})`,
          dueDate: new Date(),
        }
      });
    }, {
      maxWait: 10000, // wait up to 10s for a DB connection
      timeout: 20000  // allow up to 20s for the whole operation
    });

    // 4. Send the invoice email
    await sendRegistrationInvoiceEmail(email, name);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("REGISTRATION_API_ERROR:", error);
    return NextResponse.json({ error: 'Registration failed. Please check your connection and try again.' }, { status: 500 });
  }
}
