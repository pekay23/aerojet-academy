import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

// GET: Fetch all applications
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  // Verify Admin/Staff Role
  if (!session || (session.user as any).role === 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const applications = await prisma.application.findMany({
      include: {
        student: { include: { user: true } }, // Get student name/email
        course: true // Get course details
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
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { applicationId } = await req.json();

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { course: true }
    });

    if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Use Full Price for the Invoice
    const invoiceAmount = application.course.price;
    const description = `Tuition Fee: ${application.course.title}`;

    await prisma.$transaction(async (tx) => {
        // Update Application Status
        await tx.application.update({
            where: { id: applicationId },
            data: { status: 'APPROVED' }
        });

        // Create the Invoice for the FULL AMOUNT
        await tx.fee.create({
            data: {
                studentId: application.studentId,
                amount: invoiceAmount,
                paid: 0,
                status: 'UNPAID', // Will become PARTIAL once they pay 40%
                description: description,
                dueDate: new Date(new Date().setDate(new Date().getDate() + 14))
            }
        });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
