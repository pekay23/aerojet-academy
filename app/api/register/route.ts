import { NextResponse } from 'next/server';
import { sendApplicationReceivedEmail, sendVerificationEmail } from '@/app/lib/mail';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateRegistrationCode() {
  // Format: ATA-XXXX (e.g., ATA-9281)
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ATA-${random}`;
}

export async function POST(req: Request) {
  try {
    const { email, name, phone, programme } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.isActive) {
        return NextResponse.json({ error: 'An account with this email already exists and is active. Please login.' }, { status: 409 });
      }
      // If inactive, we might allow re-registration or just return the existing code, 
      // but for now let's blocking for simplicity or assume they need to upload proof.
      return NextResponse.json({ error: 'An application with this email already exists. Please upload your proof of payment.' }, { status: 409 });
    }

    // 2. Generate Registration Code
    let registrationCode = generateRegistrationCode();
    // Ensure uniqueness (simple check)
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const check = await prisma.student.findUnique({ where: { registrationCode } });
      if (!check) isUnique = true;
      else {
        registrationCode = generateRegistrationCode();
        attempts++;
      }
    }

    // 3. Create Inactive User (No Password yet)
    // We set a dummy password hash because schema might require it, or just null if optional. 
    // Schema says String?, so null is fine.

    // TRANSACTION
    await prisma.$transaction(async (tx) => {
      // A. Create User
      const user = await tx.user.create({
        data: {
          name,
          email,
          role: 'STUDENT',
          isActive: false, // Inactive until approved
        }
      });

      // B. Create Student with Code
      const student = await tx.student.create({
        data: {
          userId: user.id,
          phone: phone || null,
          enrollmentStatus: 'PROSPECT',
          cohort: programme || 'General Intake',
          registrationCode: registrationCode
        }
      });

      // C. Create Registration Fee
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
      maxWait: 10000,
      timeout: 20000
    });

    // 4. Generate Verification Token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    });

    // 5. Send Emails
    try {
      // Send classic application received email (with code)
      await sendApplicationReceivedEmail(email, name, registrationCode);
      // Send verification link
      await sendVerificationEmail(email, name, token);
    } catch (emailError) {
      console.error("EMAIL_SEND_ERROR:", emailError);
    }

    // 6. Success - Return Code
    return NextResponse.json({
      success: true,
      message: 'Application initiated. Please check your email to verify.',
      registrationCode: registrationCode
    });

  } catch (error) {
    console.error("REGISTRATION_API_ERROR:", error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
