import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendStaffNotification, sendProofReceivedEmail } from '@/app/lib/mail';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        // Accept registrationCode OR email
        const { email, registrationCode, proofUrl } = await req.json();

        if (!proofUrl) {
            return NextResponse.json({ error: 'Proof URL is required' }, { status: 400 });
        }

        if (!email && !registrationCode) {
            return NextResponse.json({ error: 'Email or Registration Code is required' }, { status: 400 });
        }

        let fee;
        let userForNotification;
        let registrationCodeForNotification;

        if (registrationCode) {
            // 1. Find Student by Code
            const student = await prisma.student.findUnique({
                where: { registrationCode },
                include: {
                    user: true,
                    fees: {
                        where: { status: { in: ['UNPAID', 'PARTIAL'] } },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });

            if (!student) {
                return NextResponse.json({ error: 'Invalid Registration Code' }, { status: 404 });
            }

            if (student.fees.length === 0) {
                return NextResponse.json({ error: 'No pending invoice found for this code' }, { status: 404 });
            }
            fee = student.fees[0];
            userForNotification = student.user;
            registrationCodeForNotification = registrationCode;

        } else if (email) {
            // 1. Find User by Email
            const user = await prisma.user.findFirst({
                where: { email: { equals: email, mode: 'insensitive' } },
                include: { studentProfile: true }
            });

            if (!user || !user.studentProfile) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            // 2. Find Fee
            const foundFee = await prisma.fee.findFirst({
                where: {
                    studentId: user.studentProfile.id,
                    status: { in: ['UNPAID', 'PARTIAL'] }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (!foundFee) {
                return NextResponse.json({ error: 'No pending invoice found' }, { status: 404 });
            }
            fee = foundFee;
            userForNotification = user;
            registrationCodeForNotification = user.studentProfile.registrationCode || 'N/A';
        }

        if (fee) {
            // 2. Update Fee
            await prisma.fee.update({
                where: { id: fee.id },
                data: {
                    proofUrl: proofUrl,
                    status: 'VERIFYING'
                }
            });

            // Notify Staff & Applicant
            try {
                await sendStaffNotification(
                    userForNotification?.name || 'Applicant',
                    userForNotification?.email || 'No Email',
                    `Proof of payment uploaded by ${userForNotification?.name} (${userForNotification?.email}).\nProof URL: ${proofUrl}`
                );

                // Notify Applicant
                if (userForNotification?.email) {
                    await sendProofReceivedEmail(
                        userForNotification.email,
                        userForNotification.name || 'Applicant',
                        registrationCodeForNotification
                    );
                }

            } catch (err) { console.error(err); }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("SUBMIT_PROOF_ERROR:", error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
