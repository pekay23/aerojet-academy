import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');

    // Secure endpoint
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find fees due within 3 days that are UNPAID
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    try {
        const dueFees = await prisma.fee.findMany({
            where: {
                status: 'UNPAID',
                dueDate: {
                    gte: today,
                    lte: threeDaysFromNow
                }
            },
            include: {
                student: {
                    include: { user: true }
                }
            }
        });

        let sentCount = 0;

        for (const fee of dueFees) {
            if (!fee.student.user.email) continue;

            // Send Email
            try {
                await resend.emails.send({
                    from: 'Aerojet Academy <admin@aerojet-academy.com>',
                    to: fee.student.user.email,
                    subject: 'Action Required: Fee Payment Due Soon',
                    html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2 style="color: #0F2A4A;">Payment Reminder</h2>
              <p>Dear ${fee.student.user.name},</p>
              <p>This is a friendly reminder that a payment is due soon on your account.</p>
              <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Description:</strong> ${fee.description}</p>
                <p><strong>Amount:</strong> GHS ${Number(fee.amount).toFixed(2)}</p>
                <p><strong>Due Date:</strong> ${new Date(fee.dueDate).toLocaleDateString()}</p>
              </div>
              <p>Please log in to your student portal to make the payment or upload proof of payment.</p>
              <br/>
              <p>Best regards,</p>
              <p>Aerojet Academy Finance Team</p>
            </div>
          `
                });

                // Create App Notification
                await prisma.notification.create({
                    data: {
                        userId: fee.student.userId,
                        title: 'Payment Due Soon',
                        message: `Payment of GHS ${Number(fee.amount).toFixed(2)} for ${fee.description} is due on ${new Date(fee.dueDate).toLocaleDateString()}.`,
                        type: 'WARNING',
                        link: '/student/finance'
                    }
                });

                sentCount++;
            } catch (err) {
                console.error(`Failed to send reminder to ${fee.student.user.email}`, err);
            }
        }

        return NextResponse.json({ success: true, processed: dueFees.length, sent: sentCount });
    } catch (error) {
        console.error('CRON_ERROR:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
