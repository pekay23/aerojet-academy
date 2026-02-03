import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { students } = await req.json(); // Array of students from CSV

  try {
    const results = await prisma.$transaction(
      students.map((s: any) => 
        prisma.user.upsert({
          where: { email: s.email },
          update: {}, // Don't change existing users
          create: {
            name: s.name,
            email: s.email,
            password: await hash("TempPass123!", 10), // Default password
            role: 'STUDENT',
            isActive: true,
            studentProfile: {
              create: {
                phone: s.phone,
                studentId: s.studentId,
                enrollmentStatus: 'ENROLLED'
              }
            }
          }
        })
      )
    );
    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
