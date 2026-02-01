import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch single exam run details + roster
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  // Wait for params to resolve (Next.js 15+)
  const { id } = await params;

  try {
    const run = await prisma.examRun.findUnique({
      where: { id },
      include: {
        course: true,
        room: true,
        bookings: {
          include: {
            student: { include: { user: true } }
          },
          orderBy: { seatLabel: 'asc' } // Sort by seat S01, S02...
        }
      }
    });

    if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// DELETE: Remove a student booking
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { bookingId } = await req.json();

  try {
    await prisma.examBooking.delete({
      where: { id: bookingId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
// PATCH: Assign a seat label to a booking
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { bookingId, seatLabel } = await req.json();

  try {
    // Check if seat is already taken in this exam run
    // (We need the run ID from the params or fetch the booking to be safe)
    // For MVP, we trust the admin input or add a unique constraint in Prisma (which we have: @@unique([examRunId, seatLabel]))

    await prisma.examBooking.update({
      where: { id: bookingId },
      data: { seatLabel }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to assign seat. Label might be taken.' }, { status: 500 });
  }
}
