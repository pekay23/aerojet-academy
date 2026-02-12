import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

// GET: Fetch all applications
export async function GET(req: Request) {
  const { error } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  try {
    const applications = await prisma.application.findMany({
      include: {
        student: { include: { user: true } },
        course: true
      },
      orderBy: { appliedAt: 'desc' }
    });

    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// POST: Approve an application
export async function POST(req: Request) {
  const { error } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  const { applicationId } = await req.json();

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { course: true }
    });

    if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const invoiceAmount = application.course.price;
    const description = `Tuition Fee: ${application.course.title}`;

    await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: applicationId },
        data: { status: 'APPROVED' }
      });

      await tx.fee.create({
        data: {
          studentId: application.studentId,
          amount: invoiceAmount,
          paid: 0,
          status: 'UNPAID',
          description: description,
          feeType: 'TUITION',
          currency: 'EUR',
          dueDate: new Date(new Date().setDate(new Date().getDate() + 14))
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
