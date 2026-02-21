import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

export async function GET() {
  const forms = await prisma.admissionForm.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ forms });
}

export async function POST(req: Request) {
  const { error, session } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  try {
    const body = await req.json();
    const form = await prisma.admissionForm.create({
      data: {
        name: body.name,
        targetAudience: body.targetAudience,
        selectionType: body.selectionType,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        notificationEmail: body.notificationEmail,
        registrationFee: parseFloat(body.registrationFee),
        monthlyFee: body.monthlyFee ? parseFloat(body.monthlyFee) : null,
        yearlyFee: body.yearlyFee ? parseFloat(body.yearlyFee) : null,
      }
    });
    return NextResponse.json({ success: true, form });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
  }
}
