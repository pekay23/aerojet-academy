import prisma from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { withAuth } from '@/app/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const { error } = await withAuth(['ADMIN']);
  if (error) return error;

  try {
    const { students } = await req.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const defaultPassword = await hash("Aerojet2026!", 10);

    const results = await prisma.$transaction(
      students.map((s: any) =>
        prisma.user.upsert({
          where: { email: s.email },

          update: {
            isActive: true,
            studentProfile: {
              upsert: {
                create: {
                  phone: s.phone || null,
                  studentId: s.studentId || null,
                  enrollmentStatus: 'ENROLLED',
                },
                update: {
                  phone: s.phone || undefined,
                  studentId: s.studentId || undefined,
                  enrollmentStatus: 'ENROLLED',
                }
              }
            }
          },

          create: {
            name: s.name,
            email: s.email,
            password: defaultPassword,
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
    console.error("Import Error:", error);
    return NextResponse.json({ error: 'Failed to import. Check CSV formatting.' }, { status: 500 });
  }
}
