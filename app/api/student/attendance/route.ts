import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return NextResponse.json({ records: [] });

    const records = await prisma.attendanceRecord.findMany({
        where: { studentId: student.id },
        include: { course: true },
        orderBy: { date: 'desc' }
    });

    return NextResponse.json({ records });
  } catch (error) { return NextResponse.json({ error: 'Server Error' }, { status: 500 }); }
}
