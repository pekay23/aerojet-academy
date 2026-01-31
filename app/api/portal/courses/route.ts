import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all courses and the user's specific applications
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get available courses
    const courses = await prisma.course.findMany({
      orderBy: { code: 'asc' } // Sort nicely
    });

    // 2. Try to find student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    // 3. Get applications only if student exists
    let applications: any[] = [];
    if (student) {
      applications = await prisma.application.findMany({
        where: { studentId: student.id },
      });
    }

    return NextResponse.json({ courses, applications });
  } catch (error) {
    console.error("Fetch courses error:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST: Apply for a course AND generate invoice
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { courseId } = body;

    // 1. Ensure profile exists first
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Please complete your profile before applying.' }, { status: 400 });
    }

    // 2. Check if already applied
    const existing = await prisma.application.findFirst({
      where: {
        studentId: student.id,
        courseId: courseId
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already applied for this course.' }, { status: 400 });
    }

    // 3. TRANSACTION: Create Application AND Check/Create Registration Fee
    await prisma.$transaction(async (tx) => {
      // A. Create the Application
      await tx.application.create({
        data: {
          studentId: student.id,
          courseId: courseId,
          status: "PENDING"
        }
      });

      // B. Check if they already have a Registration Fee invoice
      const hasRegFee = await tx.fee.findFirst({
        where: {
          studentId: student.id,
          description: { contains: "Registration Fee" }
        }
      });

      // C. If not, create the GHS 350 Invoice
      if (!hasRegFee) {
        await tx.fee.create({
          data: {
            studentId: student.id,
            amount: 350.00, // GHS 350
            paid: 0,
            status: "UNPAID",
            description: "Registration Fee (One-Time)",
            dueDate: new Date() // Due immediately
          }
        });
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Application error:", error);
    return NextResponse.json({ error: 'Application failed' }, { status: 500 });
  }
}
