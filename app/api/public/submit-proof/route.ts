import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, proofUrl } = await req.json();

    if (!email || !proofUrl) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Find the User & Student Profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true }
    });

    if (!user || !user.studentProfile) {
      console.error(`UPLOAD_PROOF_FAIL: No student found for email: ${email}`);
      return NextResponse.json({ error: 'No student account found with this email.' }, { status: 404 });
    }

    // 2. Find the latest UNPAID registration fee
    const pendingFee = await prisma.fee.findFirst({
      where: {
        studentId: user.studentProfile.id,
        status: 'UNPAID', // Look strictly for UNPAID invoices
        description: {
          contains: "Registration Fee"
        }
      },
      orderBy: { dueDate: 'desc' }
    });

    if (!pendingFee) {
      console.error(`UPLOAD_PROOF_FAIL: No UNPAID Registration Fee invoice found for student: ${user.studentProfile.id}`);
      return NextResponse.json({ error: 'No pending registration invoice found for this account.' }, { status: 404 });
    }

    // 3. Update the Fee with the Proof and set to VERIFYING
    await prisma.fee.update({
      where: { id: pendingFee.id },
      data: {
        status: 'VERIFYING',
        proofUrl: proofUrl
      }
    });

    console.log(`SUCCESS: Proof for ${email} submitted. Fee ID ${pendingFee.id} status is now VERIFYING.`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Proof Submission API Error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
