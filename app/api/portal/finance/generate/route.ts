import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, id, title, price } = await req.json(); // Accept specific item details
  
  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });

  // Prevent duplicate unpaid invoices for the same item
  const existing = await prisma.fee.findFirst({
    where: { 
      studentId: student?.id, 
      description: { contains: title }, 
      status: { not: 'PAID' } 
    }
  });

  if (existing) {
    return NextResponse.json({ error: 'An invoice for this item already exists.' }, { status: 400 });
  }

  // Create specific invoice
  await prisma.fee.create({
    data: {
      studentId: student!.id,
      amount: parseFloat(price),
      status: 'UNPAID',
      description: `${type === 'COURSE' ? 'Tuition' : 'Exam Fee'}: ${title}`,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
    }
  });

  // OPTIONAL: If it's a course, create a PENDING application immediately so they are "linked"
  if (type === 'COURSE') {
    await prisma.application.create({
        data: {
            studentId: student!.id,
            courseId: id,
            status: 'PENDING' // Will move to APPROVED when fee is paid
        }
    });
  }

  return NextResponse.json({ success: true });
}
