import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // 1. Find Verification Token
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token }
        });

        if (!verificationToken) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        // 2. Check Expiry
        if (new Date() > verificationToken.expires) {
            return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
        }

        // 3. Verify User
        const user = await prisma.user.findFirst({
            where: { email: verificationToken.identifier }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 4. Update User and Delete Token
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: new Date(),
                    isActive: true // Activate user upon email verification
                }
            }),
            prisma.verificationToken.delete({
                where: { token }
            })
        ]);

        // 5. Redirect or Return Success
        // Since this is an API route called by the frontend page, we return JSON.
        return NextResponse.json({ success: true, message: 'Email verified successfully!' });

    } catch (error) {
        console.error('VERIFY_EMAIL_ERROR:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
