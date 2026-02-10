import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { sendAdmissionApprovalEmail } from '@/app/lib/mail';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        // Basic role check - in a real app, use a middleware or more robust check
        if (user.role === 'STUDENT' || user.role === 'PROSPECT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { feeId } = body;

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

        // Update Fee
        const updatedFee = await prisma.fee.update({
            where: { id: feeId },
            data: {
                status: 'PAID',
                paid: fee.amount
            }
        });

        // Registration Logic
        let statusUpdated = false;
        if (fee.description?.toLowerCase().includes('registration') && fee.student.enrollmentStatus === 'PROSPECT') {

            // 1. Generate Credentials
            const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
            const hashedPassword = await hash(tempPassword, 10);

            // 2. Activate User & Update Password
            await prisma.user.update({
                where: { id: fee.student.userId },
                data: {
                    password: hashedPassword,
                    isActive: true,
                    // If we want to mark email as verified since they paid, we can:
                    emailVerified: new Date()
                }
            });

            // 3. Update Student Status
            await prisma.student.update({
                where: { id: fee.studentId },
                data: { enrollmentStatus: 'APPLICANT' }
            });
            statusUpdated = true;

            // 4. Send Credentials Email
            if (fee.student.user.email) {
                try {
                    await sendAdmissionApprovalEmail(
                        fee.student.user.email,
                        fee.student.user.name || 'Student',
                        tempPassword
                    );
                } catch (emailError) {
                    console.error('FAILED_TO_SEND_CREDENTIALS', emailError);
                }
            }
        }

        return NextResponse.json({ success: true, fee: updatedFee, statusUpdated });

    } catch (error) {
        console.error('APPROVE_FEE_ERROR:', error);
        return NextResponse.json({ error: 'Failed to approve fee' }, { status: 500 });
    }
}
