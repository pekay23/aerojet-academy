import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { sendPaymentRejectedEmail } from '@/app/lib/mail';
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
                await sendPaymentRejectedEmail(
                    fee.student.user.email,
                    fee.student.user.name || 'Student',
                    fee.description || 'Fee',
                    reason
                );
            } catch (emailError) {
                console.error('FAILED_TO_SEND_REJECT_EMAIL', emailError);
            }
        }

        return NextResponse.json({ success: true, fee: updatedFee });

    } catch (error) {
        console.error('REJECT_FEE_ERROR:', error);
        return NextResponse.json({ error: 'Failed to reject fee' }, { status: 500 });
    }
}
