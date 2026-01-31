import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    // 1. Get the application details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { course: true }
    });

    if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // 2. Calculate Deposit Amount
    // Logic: If Exam Only -> Full Price. If Full Time -> 40%
    const isExamOnly = application.course.duration === 'Exam Only';
    const depositAmount = isExamOnly ? application.course.price : (application.course.price * 0.40);
    const description = isExamOnly ? `Exam Fee: ${application.course.code}` : `Seat Deposit: ${application.course.title}`;

    await prisma.$transaction(async (tx) => {
        // Update Application Status
        await tx.application.update({
            where: { id: applicationId },
            data: { status: 'APPROVED' }
        });

        // Create the Invoice
        await tx.fee.create({
            data: {
                studentId: application.studentId,
                amount: depositAmount,
                paid: 0,
                status: 'UNPAID',
                description: description,
                dueDate: new Date(new Date().setDate(new Date().getDate() + 14)) // Due in 14 days
            }
        });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
