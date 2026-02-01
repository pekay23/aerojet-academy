import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
    if (!student) return NextResponse.json({ bookings: [] });

    const bookings = await prisma.examBooking.findMany({
      where: { studentId: student.id },
      include: {
        run: {
          include: {
            course: true,
            room: true
          }
        }
      },
      orderBy: { run: { startDatetime: 'asc' } }
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
