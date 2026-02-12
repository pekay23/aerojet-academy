import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { withAuth } from '@/app/lib/auth-helpers';
import { FEE_STATUS } from '@/app/lib/constants'; // Optional: Use constant if we want to standardize 'REJECTED' too? No constant for rejected yet? 
// The constant file had: PAID, PARTIAL, UNPAID, PENDING, VERIFYING, OVERDUE.
// Let's check logic. If status is REJECTED, we might need to add it to constants or just use string for now if not in list.
// I'll stick to string 'REJECTED' or add it to constants? 
// Audit said "Standardize fee status values".
// If I use 'REJECTED', I should probably add it to constants.
// For now, I'll stick to the existing string to avoid breaking schema enum if it's strict?
// Prisma schema says String.
// I'll use string 'REJECTED' to match previous logic, but use `withAuth`.

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    const { error, session } = await withAuth(['ADMIN', 'STAFF']);
    if (error) return error;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { feeId, reason } = body;

        if (!feeId) {
            return NextResponse.json({ error: 'Fee ID is required' }, { status: 400 });
        }

        const fee = await prisma.fee.findUnique({
            where: { id: feeId },
            include: {
                student: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!fee) {
            return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
        }

        const updatedFee = await prisma.fee.update({
            where: { id: feeId },
            data: {
                status: 'REJECTED', // could use constant if added
            }
        });

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
