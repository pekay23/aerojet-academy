import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch upcoming exam runs
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const examRuns = await prisma.examRun.findMany({
      where: {
        status: 'SCHEDULED',
        startDatetime: { gt: new Date() } // Future exams only
      },
      include: {
        course: true, // Include module details
        room: true,
        bookings: true // To calculate remaining seats
      },
      orderBy: { startDatetime: 'asc' }
    });

    return NextResponse.json({ examRuns });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}

// POST: Book a seat
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { runId } = await req.json();

  try {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
    if (!student) return NextResponse.json({ error: 'Profile required' }, { status: 400 });

    // 1. Check for EXISTING booking first
    const existingBooking = await prisma.examBooking.findFirst({
        where: {
            studentId: student.id,
            examRunId: runId
        }
    });

    if (existingBooking) {
        return NextResponse.json({ error: 'You have already booked a seat for this exam.' }, { status: 400 });
    }

    // 2. Check availability
    const run = await prisma.examRun.findUnique({
        where: { id: runId },
        include: { bookings: true }
    });

    if (!run) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    if (run.bookings.length >= run.maxCapacity) {
        return NextResponse.json({ error: 'Exam is full' }, { status: 400 });
    }

    // 3. Create Booking
    await prisma.examBooking.create({
        data: {
            studentId: student.id,
            examRunId: runId,
            status: 'CONFIRMED'
        }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 });
  }
}
