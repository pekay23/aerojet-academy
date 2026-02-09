import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
    // Basic aggregation
    const totalRevenue = await prisma.fee.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true }
    });
    return NextResponse.json({ totalRevenue: totalRevenue._sum.amount || 0 });
}
