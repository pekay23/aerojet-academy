import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { students } = await req.json();
    if (!Array.isArray(students)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    // Pre-hash password ONCE to avoid 'await' inside the map loop
    const defaultHashedPassword = await hash("TempPass123!", 10);

    const results = await prisma.$transaction(
      students.map((s: any) => 
        prisma.user.upsert({
          where: { email: s.email },
          update: {}, 
          create: {
            name: s.name,
            email: s.email,
            password: defaultHashedPassword,
            role: 'STUDENT',
            isActive: true,
            studentProfile: {
              create: {
                phone: s.phone || null,
                studentId: s.studentId || null,
                enrollmentStatus: 'ENROLLED'
              }
            }
          }
        })
      )
    );

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
