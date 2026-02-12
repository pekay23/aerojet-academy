import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // For security, don't reveal if user exists
            return NextResponse.json({ success: true });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

        await resend.emails.send({
            from: 'Aerojet Academy <onboarding@resend.dev>', // Update with verify domain if available
            to: email,
            subject: 'Reset Your Password',
            html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('FORGOT_PASSWORD_ERROR:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
