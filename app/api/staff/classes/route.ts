import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET() {
  // Accessing 'cohort' instead of 'class'
  const cohorts = await prisma.cohort.findMany({
    include: { intake: true, _count: { select: { students: true } } }
  });
  return NextResponse.json({ cohorts });
}

export async function POST(req: Request) {
  const { error, session } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

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
