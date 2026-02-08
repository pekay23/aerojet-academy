import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const fees = await prisma.fee.findMany({
      include: { 
        student: { 
            include: { user: true } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ fees });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
