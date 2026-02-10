import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;

        // Parse form data
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const feeId = formData.get('feeId') as string;

        if (!file || !feeId) {
            return NextResponse.json({ error: 'File and fee ID required' }, { status: 400 });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and PDF allowed.' }, { status: 400 });
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
        }

        // Verify fee belongs to this user
        const fee = await prisma.fee.findFirst({
            where: {
                id: feeId,
                student: { userId: user.id }
            }
        });

        if (!fee) {
            return NextResponse.json({ error: 'Fee not found or unauthorized' }, { status: 404 });
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs');

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const filename = `proof_${user.id}_${timestamp}.${fileExtension}`;
        const filepath = path.join(uploadsDir, filename);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists
        const fs = require('fs');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        await writeFile(filepath, buffer);

        // Update fee record with proof URL and status
        const proofUrl = `/uploads/payment-proofs/${filename}`;
        await prisma.fee.update({
            where: { id: feeId },
            data: {
                status: 'PENDING',
                proofUrl: proofUrl
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Proof of payment uploaded successfully',
            proofUrl
        });

    } catch (error) {
        console.error('UPLOAD_PAYMENT_ERROR:', error);
        return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
    }
}
