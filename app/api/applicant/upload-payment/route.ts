import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { sendProofReceivedEmail } from '@/app/lib/mail';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        const body = await req.json();
        const { feeId, proofUrl } = body;

        if (!feeId || !proofUrl) {
            return NextResponse.json({ error: 'Fee ID and Proof URL are required' }, { status: 400 });
        }

        // Verify fee belongs to this user
        const fee = await prisma.fee.findFirst({
            where: {
                id: feeId,
                student: { userId: user.id }
            },
            include: { student: true }
        });

        if (!fee) {
            return NextResponse.json({ error: 'Fee not found or unauthorized' }, { status: 404 });
        }

        // Update fee record
        await prisma.fee.update({
            where: { id: feeId },
            data: {
                status: 'PENDING',
                proofUrl: proofUrl
            }
        });

        // Notify Staff (Optional - can reuse existing logic or just rely on dashboard)
        // Send Confirmation Email to Applicant
        try {
            if (user.email && fee.student && fee.student.registrationCode) {
                await sendProofReceivedEmail(user.email, user.name || "Applicant", fee.student.registrationCode);
            }
        } catch (emailError) {
            console.error("Failed to send email", emailError);
        }

        return NextResponse.json({
            success: true,
            message: 'Proof of payment submitted successfully'
        });

    } catch (error) {
        console.error('SUBMIT_PAYMENT_ERROR:', error);
        return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
    }
}
