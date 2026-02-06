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

    // 2. Generate a secure placeholder password (User will set/reset this later)
    // We set isActive to false so they can't log in until payment is verified.
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
    const hashedPassword = await hash(tempPassword, 10);

    // 3. TRANSACTION: Create User + Student Profile + Registration Invoice
    await prisma.$transaction(async (tx) => {
      // A. Create User Account
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          isActive: false, // Locked until payment verified
        }
      });

      // B. Create Student Profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          phone: phone || null,
          enrollmentStatus: 'APPLICANT',
          // Store the program interest in 'cohort' or a new field if you prefer
          cohort: programme || 'General Intake' 
        }
      });

      // C. CRITICAL: Create the Registration Fee Invoice
      // This is what the Proof of Payment will attach to.
      await tx.fee.create({
        data: {
          studentId: student.id,
          amount: 350.00, // Standard Registration Fee
          paid: 0,
          status: 'UNPAID',
          description: `Registration Fee (${programme || 'General'})`,
          dueDate: new Date(), // Due immediately
        }
      });
      
      // Optional: Track where they came from (if using the wizard)
      if (sourceId) {
        console.log(`Applicant ${email} came from source: ${sourceId}`);
      }
    });

    // 4. Send the Invoice Email
    // This email contains the link to the Upload Proof page
    await sendRegistrationInvoiceEmail(email, name);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
