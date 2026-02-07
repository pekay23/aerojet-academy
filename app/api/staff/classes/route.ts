import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  // Accessing 'cohort' instead of 'class'
  const cohorts = await prisma.cohort.findMany({
    include: { intake: true, _count: { select: { students: true } } }
  });
  return NextResponse.json({ cohorts });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { name, code, intakeId } = await req.json();
    const newCohort = await prisma.cohort.create({
      data: { name, code, intakeId }
    });
    return NextResponse.json({ success: true, cohort: newCohort });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
