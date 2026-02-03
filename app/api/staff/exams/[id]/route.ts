import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch single exam run details + roster
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // Updated for Next.js 15
) {
  const session = await getServerSession(authOptions);
  
  // Verify Admin/Staff Role
  if (!session || (session.user as any).role === 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Await params before accessing the id
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
          orderBy: { seatLabel: 'asc' } 
        }
      }
    });

    if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ run });
  } catch (error) {
    console.error("Fetch Exam Roster Error:", error);
    return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 });
  }
}

// DELETE: Remove a student booking
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role === 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Await params even if id isn't used directly in the body, 
  // ensuring method signature matches the route
  const { id } = await params; 
  const { bookingId } = await req.json();

  try {
    await prisma.examBooking.delete({
      where: { id: bookingId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Booking Error:", error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

// PATCH: Assign a seat label to a booking
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role === 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const { bookingId, seatLabel } = await req.json();

  try {
    // Note: id (examRunId) could be used here for additional verification 
    // to ensure the booking belongs to this specific run.
    
    await prisma.examBooking.update({
      where: { id: bookingId },
      data: { seatLabel }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Assign Seat Error:", error);
    return NextResponse.json({ error: 'Failed to assign seat. Label might be taken.' }, { status: 500 });
  }
}
