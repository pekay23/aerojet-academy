import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cohorts = await prisma.cohort.findMany({
        orderBy: { name: 'asc' }
    });
    return NextResponse.json({ cohorts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
