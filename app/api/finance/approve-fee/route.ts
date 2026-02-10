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
        const { feeId } = body;

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

        if (fee.status === 'PAID') {
            return NextResponse.json({ error: 'Fee is already paid' }, { status: 400 });
        }

        // 2. Update Fee Status
        const updatedFee = await prisma.fee.update({
            where: { id: feeId },
            data: {
                status: 'PAID',
                paid: fee.amount // Assume full amount paid
            }
        });

        // 3. Update Student Status if needed
        // If this is the registration fee, upgrade PROSPECT to APPLICANT
        let statusUpdated = false;
        if (fee.description?.toLowerCase().includes('registration') && fee.student.enrollmentStatus === 'PROSPECT') {
            await prisma.student.update({
                where: { id: fee.studentId },
                data: { enrollmentStatus: 'APPLICANT' }
            });
            statusUpdated = true;
        }

        // 4. Send Email Notification
        if (fee.student.user.email) {
            try {
                await resend.emails.send({
                    from: 'Aerojet Academy <admissions@aerojet-academy.com>',
                    to: fee.student.user.email,
                    subject: 'Payment Approved - Application Access Granted',
                    html: `
                        <h2>Payment Confirmed</h2>
                        <p>Dear ${fee.student.user.name || 'Student'},</p>
                        <p>We have confirmed your payment of <strong>€${fee.amount}</strong> for <strong>${fee.description}</strong>.</p>
                        ${statusUpdated ? `<p><strong>Your status has been updated to APPLICANT.</strong> You can now log in to the portal and begin your application process.</p>` : ''}
                        <p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Portal</a>
                        </p>
                        <p>Regards,<br>Aerojet Admissions Team</p>
                    `
                });
            } catch (emailError) {
                console.error('FAILED_TO_SEND_EMAIL', emailError);
            }
        }

        return NextResponse.json({ success: true, fee: updatedFee, statusUpdated });

    } catch (error) {
        console.error('APPROVE_FEE_ERROR:', error);
        return NextResponse.json({ error: 'Failed to approve fee' }, { status: 500 });
    }
}
