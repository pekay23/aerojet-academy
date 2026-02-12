import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { sendProofReceivedEmail, sendStaffNotification } from '@/app/lib/mail';
import { FEE_STATUS } from '@/app/lib/constants';
import { withAuth } from '@/app/lib/auth-helpers';

export async function POST(req: Request) {
    try {
        const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;

        const user = session.user as { id: string; email?: string; name?: string };
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
                status: FEE_STATUS.VERIFYING,
                proofUrl: proofUrl
            }
        });

        // Archive in Document History
        await prisma.studentFile.create({
            data: {
                studentId: fee.studentId,
                name: `Payment Proof - ${fee.description}`,
                url: proofUrl,
                type: 'FINANCE'
            }
        });

        // Notify Staff via Email
        try {
            await sendStaffNotification(
                user.name || 'Applicant',
                user.email || 'No Email',
                `New payment proof uploaded by ${user.name} for fee ${fee.description}. Link: ${proofUrl}`,
                `Action Required: Payment Proof Uploaded`
            );
        } catch (e) { console.error("Staff email failed", e); }

        // Notify Staff via DB Notification
        try {
            // Find admins/staff
            const staff = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'STAFF'] } } });
            await prisma.notification.createMany({
                data: staff.map(s => ({
                    userId: s.id,
                    title: 'New Payment Proof',
                    message: `${user.name} uploaded proof for ${fee.description}`,
                    type: 'INFO',
                    link: '/staff/finance'
                }))
            });
        } catch (e) { console.error("DB notification failed", e); }

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
