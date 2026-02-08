import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, proofUrl } = await req.json();

    if (!email || !proofUrl) {
        return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Find User (Case Insensitive)
    const user = await prisma.user.findFirst({
        where: { 
            email: { equals: email, mode: 'insensitive' } 
        },
        include: { studentProfile: true }
    });

    if (!user || !user.studentProfile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Find Pending Fee
    const fee = await prisma.fee.findFirst({
        where: { 
            studentId: user.studentProfile.id,
            status: { in: ['UNPAID', 'PARTIAL'] }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!fee) {
        return NextResponse.json({ error: 'No pending invoice found' }, { status: 404 });
    }

    // 3. Update Fee
    await prisma.fee.update({
        where: { id: fee.id },
        data: { 
            proofUrl: proofUrl,
            status: 'VERIFYING' 
        }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("SUBMIT_PROOF_ERROR:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
