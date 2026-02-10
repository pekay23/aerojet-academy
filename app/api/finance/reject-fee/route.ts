import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;

        // Role Check
        if (user.role === 'STUDENT' || user.role === 'PROSPECT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { feeId, reason } = body;

        if (!feeId) {
            return NextResponse.json({ error: 'Fee ID is required' }, { status: 400 });
        }

        // 1. Get the Fee
        const fee = await prisma.fee.findUnique({
            where: { id: feeId },
            include: { student: { include: { user: true } } }
        });

        if (!fee) {
            return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
        }

        // 2. Update Fee Status
        // We set it to REJECTED (or UNPAID? REJECTED is better for history, but maybe we want them to re-upload on the same fee ID?)
        // If we set it to REJECTED, the user might need a new Fee record or we reset this one to UNPAID so they can upload again.
        // Let's set it to 'UNPAID' and clear the proofUrl so they can try again, but maybe keep a log/note?
        // Actually, let's look at the upload logic. It finds a fee. If status is UNPAID or REJECTED they can probably upload.
        // Let's set status to 'REJECTED' for clarity. User sees "Rejected" and can "Retry".

        const updatedFee = await prisma.fee.update({
            where: { id: feeId },
            data: {
                status: 'REJECTED',
                // proofUrl: null // Optionally clear it, or keep it for record.
            }
        });

        // 3. Send Email Notification
        if (fee.student.user.email) {
            try {
                await resend.emails.send({
                    from: 'Aerojet Academy <admissions@aerojet-academy.com>',
                    to: fee.student.user.email,
                    subject: 'Payment Proof Rejected',
                    html: `
                        <h2>Proof of Payment Rejected</h2>
                        <p>Dear ${fee.student.user.name || 'Student'},</p>
                        <p>We reviewed your proof of payment for <strong>${fee.description}</strong> and unfortunately it was rejected.</p>
                        <p><strong>Reason:</strong> ${reason || 'Document unclear or invalid amount.'}</p>
                        <p>Please log in and upload a valid proof of payment.</p>
                        <p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/applicant/payment" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Payment Page</a>
                        </p>
                        <p>Regards,<br>Aerojet Finance Team</p>
                    `
                });
            } catch (emailError) {
                console.error('FAILED_TO_SEND_EMAIL', emailError);
            }
        }

        return NextResponse.json({ success: true, fee: updatedFee });

    } catch (error) {
        console.error('REJECT_FEE_ERROR:', error);
        return NextResponse.json({ error: 'Failed to reject fee' }, { status: 500 });
    }
}
