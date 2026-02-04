import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

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

    // Hash a default password for these imported accounts
    // They can change it later via the "Security" tab we built
    const defaultPassword = await hash("Aerojet2026!", 10);

    const results = await prisma.$transaction(
      students.map((s: any) => 
        prisma.user.upsert({
          where: { email: s.email },
          update: {
             // If user exists, ensure they are active
             isActive: true 
          }, 
          create: {
            name: s.name,
            email: s.email,
            password: defaultPassword,
            role: 'STUDENT',
            isActive: true, // Imported students bypass the payment gate
            studentProfile: {
              create: {
                phone: s.phone || null,
                studentId: s.studentId || null, // e.g. AATA0001
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
