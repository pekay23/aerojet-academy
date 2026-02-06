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
      return NextResponse.json({ error: 'No student account found with this email.' }, { status: 404 });
    }

    // 2. Find the latest UNPAID fee (Registration or other)
    const pendingFee = await prisma.fee.findFirst({
      where: {
        studentId: user.studentProfile.id,
        status: { in: ['UNPAID', 'PARTIAL'] }
      },
      orderBy: { dueDate: 'desc' } // Prioritize most recent
    });

    if (!pendingFee) {
      return NextResponse.json({ error: 'No pending invoices found for this account.' }, { status: 404 });
    }

    // 3. Update the Fee with the Proof
    await prisma.fee.update({
      where: { id: pendingFee.id },
      data: {
        status: 'VERIFYING',
        proofUrl: proofUrl
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Proof Submission Error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
