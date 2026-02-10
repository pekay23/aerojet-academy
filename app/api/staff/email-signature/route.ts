import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// PrismaClient singleton pattern for Next.js
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query', 'error', 'warn'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
    try {
        // Get the first (and only) email signature record
        let signature = await prisma.emailSignature.findFirst();

        // If no signature exists, create one with defaults
        if (!signature) {
            console.log('No signature found, creating default one...');
            signature = await prisma.emailSignature.create({
                data: {}
            });
        }

        return NextResponse.json({ signature });
    } catch (error) {
        console.error('Error fetching email signature:', error);
        return NextResponse.json(
            { error: 'Failed to fetch email signature' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        console.log('Received save request for email signature');
        const data = await req.json();
        console.log('Request data:', JSON.stringify(data, null, 2));

        // Validate required fields
        const {
            logoUrl,
            name,
            role,
            phone,
            email,
            website,
            address,
            services,
            primaryColor,
            accentColor
        } = data;

        // Get the first signature or create it
        const existingSignature = await prisma.emailSignature.findFirst();
        console.log('Existing signature ID:', existingSignature?.id);

        let signature;
        if (existingSignature) {
            console.log('Updating existing signature...');
            // Update existing signature
            signature = await prisma.emailSignature.update({
                where: { id: existingSignature.id },
                data: {
                    logoUrl: logoUrl ?? existingSignature.logoUrl,
                    name: name ?? existingSignature.name,
                    role: role ?? existingSignature.role,
                    phone: phone ?? existingSignature.phone,
                    email: email ?? existingSignature.email,
                    website: website ?? existingSignature.website,
                    address: address ?? existingSignature.address,
                    services: services ?? existingSignature.services,
                    primaryColor: primaryColor ?? existingSignature.primaryColor,
                    accentColor: accentColor ?? existingSignature.accentColor,
                }
            });
        } else {
            console.log('Creating new signature...');
            // Create new signature
            signature = await prisma.emailSignature.create({
                data: {
                    logoUrl,
                    name,
                    role,
                    phone,
                    email,
                    website,
                    address,
                    services,
                    primaryColor,
                    accentColor
                }
            });
        }

        console.log('Signature saved successfully:', signature.id);
        return NextResponse.json({ success: true, signature });
    } catch (error) {
        console.error('Error updating email signature:', error);
        return NextResponse.json(
            { error: 'Failed to update email signature', details: String(error) },
            { status: 500 }
        );
    }
}
