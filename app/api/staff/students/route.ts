import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const students = await prisma.student.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({ students });
}

// NEW: POST to create a student manually
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { name, email, password } = await req.json();

  try {
    const hashedPassword = await hash(password, 10);

    // Create User and Student Profile in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'STUDENT',
        }
      });

      return await tx.student.create({
        data: {
          userId: user.id,
          enrollmentStatus: 'APPLICANT'
        }
      });
    });

    return NextResponse.json({ success: true, student: result });
  } catch (error) {
    return NextResponse.json({ error: 'User already exists or failed to create' }, { status: 500 });
  }
}
