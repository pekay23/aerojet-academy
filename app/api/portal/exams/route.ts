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

// POST: Book a seat (Uses Wallet or Creates Invoice)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { runId } = await req.json();

  try {
    // 1. Get Student Profile
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
    if (!student) return NextResponse.json({ error: 'Profile required' }, { status: 400 });

    // 2. Check for EXISTING booking
    const existingBooking = await prisma.examBooking.findFirst({
        where: {
            studentId: student.id,
            examRunId: runId
        }
    });

    if (existingBooking) {
        return NextResponse.json({ error: 'You have already booked a seat for this exam.' }, { status: 400 });
    }

    // 3. Check Exam Availability
    const run = await prisma.examRun.findUnique({
        where: { id: runId },
        include: { bookings: true, course: true }
    });

    if (!run) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    if (run.bookings.length >= run.maxCapacity) {
        return NextResponse.json({ error: 'Exam is full' }, { status: 400 });
    }

    // 4. Check Wallet Balance
    const wallet = await prisma.wallet.findUnique({ where: { studentId: student.id } });
    const hasCredit = wallet && wallet.balance > 0;

    let bookingStatus = 'PENDING_PAYMENT'; 
    if (hasCredit) {
        bookingStatus = 'CONFIRMED';
    }

    // 5. TRANSACTION: Execute Booking Logic
    await prisma.$transaction(async (tx) => {
        // A. Create the Booking Record
        await tx.examBooking.create({
            data: {
                studentId: student.id,
                examRunId: runId,
                status: bookingStatus
            }
        });

        // B. Handle Payment Logic
        if (hasCredit && wallet) {
            // Case 1: Use a Credit from Wallet
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: 1 } }
            });
            
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount: -1,
                    type: 'USAGE',
                    description: `Booked Exam: ${run.course.code}`
                }
            });
        } else {
            // Case 2: Create a Single-Seat Invoice
            await tx.fee.create({
                data: {
                    studentId: student.id,
                    amount: 520.00, // Standard Single Seat Price (or fetch from run.course.price)
                    paid: 0,
                    status: 'UNPAID',
                    description: `Exam Booking: ${run.course.code} (${new Date(run.startDatetime).toLocaleDateString()})`,
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)) // Due in 7 days
                }
            });
        }
    });

    // Return different messages based on outcome
    if (hasCredit) {
        return NextResponse.json({ success: true, message: "Booking confirmed using wallet credit." });
    } else {
        return NextResponse.json({ success: true, message: "Booking reserved. Please pay the invoice in Finance." });
    }

  } catch (error) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 });
  }
}
