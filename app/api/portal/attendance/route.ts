import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ records: [] });

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: student.id },
    include: { course: true },
    orderBy: { date: 'desc' }
  });

  return NextResponse.json({ records });
}
