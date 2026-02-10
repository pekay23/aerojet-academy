import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'STAFF', 'INSTRUCTOR'].includes((session.user as any).role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subject, message, target, selectedIds } = await req.json();

    if (!subject || !message) {
        return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    try {
        let recipients: { email: string | null; name: string | null }[] = [];

        if (target === 'CUSTOM' && selectedIds?.length > 0) {
            recipients = await prisma.user.findMany({
                where: { id: { in: selectedIds }, isDeleted: false },
                select: { email: true, name: true }
            });
        } else if (target === 'ALL_STUDENTS') {
            recipients = await prisma.user.findMany({
                where: { role: 'STUDENT', isDeleted: false, isActive: true },
                select: { email: true, name: true }
            });
        } else if (target === 'APPLICANTS') {
            recipients = await prisma.user.findMany({
                where: { role: 'STUDENT', isDeleted: false, student: { enrollmentStatus: { in: ['PROSPECT', 'APPLICANT'] } } },
                select: { email: true, name: true }
            });
        } else if (target === 'STAFF') {
            recipients = await prisma.user.findMany({
                where: { role: { in: ['STAFF', 'INSTRUCTOR', 'ADMIN'] }, isDeleted: false },
                select: { email: true, name: true }
            });
        }

        const validEmails = recipients.filter(r => r.email).map(r => r.email!);

        if (validEmails.length === 0) {
            return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
        }

        // Send emails in batches of 50
        const batchSize = 50;
        let sentCount = 0;
        for (let i = 0; i < validEmails.length; i += batchSize) {
            const batch = validEmails.slice(i, i + batchSize);
            await resend.emails.send({
                from: 'Aerojet Academy <admin@aerojet-academy.com>',
                to: 'admin@aerojet-academy.com',
                bcc: batch,
                subject: subject,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0F2A4A; padding: 24px; text-align: center;">
              <h2 style="color: white; margin: 0;">Aerojet Academy</h2>
            </div>
            <div style="padding: 24px; background: white;">
              <div style="white-space: pre-wrap; color: #333; line-height: 1.6; font-size: 15px;">${message}</div>
            </div>
            <div style="padding: 16px; background: #f8f9fa; text-align: center; font-size: 12px; color: #666;">
              This message was sent by Aerojet Academy staff.
            </div>
          </div>
        `
            });
            sentCount += batch.length;
        }

        return NextResponse.json({ success: true, count: sentCount });
    } catch (error) {
        console.error('Communication error:', error);
        return NextResponse.json({ error: 'Failed to send messages' }, { status: 500 });
    }
}
