import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hash } from 'bcryptjs';

// GET: List all students
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const students = await prisma.student.findMany({
    include: { 
        // 🔒 SECURITY FIX: Only select safe fields
        user: {
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                isActive: true
            }
        }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ students });
}

// POST: Create student manually
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { name, email, password } = await req.json();

  try {
    const hashedPassword = await hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          isActive: true, // Manual creations should be active by default?
        }
      });

      return await tx.student.create({
        data: {
          userId: user.id,
          enrollmentStatus: 'APPLICANT' // Default to Applicant
        }
      });
    });

    return NextResponse.json({ success: true, student: result });
  } catch (error) {
    return NextResponse.json({ error: 'User already exists or failed to create' }, { status: 500 });
  }
}
