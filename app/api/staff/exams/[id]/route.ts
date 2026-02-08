import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET: Fetch single Exam Pool details + Roster (Members)
 */
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role === 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Fetch Pool with Memberships
    const pool = await prisma.examPool.findUnique({
      where: { id },
      include: {
        event: true, // Include parent event
        memberships: {
          include: {
            student: { 
                include: { user: { select: { name: true, email: true, image: true } } } 
            }
          },
          orderBy: { createdAt: 'asc' } // First come, first served
        }
      }
    });

    if (!pool) return NextResponse.json({ error: 'Pool not found' }, { status: 404 });

    return NextResponse.json({ run: pool }); // Keeping 'run' key for frontend compat if needed, or change to 'pool'
  } catch (error) {
    console.error("Fetch Pool Error:", error);
    return NextResponse.json({ error: 'Failed to fetch pool' }, { status: 500 });
  }
}

/**
 * DELETE: Remove a student (Membership) from the pool
 */
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role === 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { membershipId } = await req.json(); // Changed from bookingId

  try {
    // 1. Delete the membership
    const deleted = await prisma.poolMembership.delete({
      where: { id: membershipId },
      include: { pool: true }
    });

    // 2. Refund logic would go here (e.g. update Wallet)
    // For now, we just remove the record.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove Member Error:", error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

/**
 * PATCH: Update Membership (e.g. Assign Seat Label if you added that field)
 * Note: PoolMembership doesn't have 'seatLabel' in the current schema unless you add it.
 * I will comment this out until you add it, or we can use it to update status.
 */
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
    return NextResponse.json({ message: "Seat assignment not implemented in Pool Schema yet" });
}
