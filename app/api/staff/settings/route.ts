import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
    const settings = await prisma.systemSetting.findMany();
    return NextResponse.json({ settings });
}

export async function POST(req: Request) {
    const { key, value } = await req.json();
    await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
    });
    return NextResponse.json({ success: true });
}
