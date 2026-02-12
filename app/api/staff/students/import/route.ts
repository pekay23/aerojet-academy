import prisma from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hash } from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Security: Only Admins can perform bulk imports
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { students } = await req.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const defaultPassword = await hash("Aerojet2026!", 10);

    const results = await prisma.$transaction(
      students.map((s: any) => 
        prisma.user.upsert({
          where: { email: s.email },
          
          // CASE 1: User Exists -> Update their info & link student profile
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
                        enrollmentStatus: 'ENROLLED', // Force enroll if importing
                    }
                }
             }
          }, 
          
          // CASE 2: New User -> Create everything
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
