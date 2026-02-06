import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET: Fetch single student details
 * OPTIMIZED: Uses 'take' and 'select' to prevent 10s load times
 */
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'STAFF', 'INSTRUCTOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isActive: true,
            isDeleted: true,
          }
        },
        // 🚀 PERFORMANCE FIX: Only fetch the last few items to avoid data bloat
        applications: { 
          take: 5, 
          orderBy: { appliedAt: 'desc' }, 
          include: { course: true } 
        },
        fees: { 
          take: 15, 
          orderBy: { dueDate: 'desc' } 
        },
        examBookings: { 
          take: 10, 
          orderBy: { bookedAt: 'desc' }, 
          include: { run: { include: { course: true } } } 
        },
        attendance: { 
          take: 30, 
          orderBy: { date: 'desc' },
          include: { course: { select: { code: true } } }
        },
        assessments: { 
          take: 20, 
          orderBy: { recordedAt: 'desc' } 
        },
        notes: { 
          take: 10, 
          orderBy: { createdAt: 'desc' } 
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    return NextResponse.json({ student });

  } catch (error) {
    console.error("FETCH_STUDENT_DETAIL_ERROR:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH: Update Student Details
 */
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { id } = await params;

    const student = await prisma.student.update({
      where: { id },
      data: {
        studentId: body.studentId || undefined,
        photoUrl: body.photoUrl || undefined,
        phone: body.phone || undefined,
        gender: body.gender || undefined,
        enrollmentStatus: body.enrollmentStatus || undefined,
        cohort: body.cohort || undefined,
        address: body.address || undefined,
        city: body.city || undefined,
        region: body.region || undefined,
      }
    });

    return NextResponse.json({ success: true, student });

  } catch (error) {
    console.error("UPDATE_STUDENT_ERROR:", error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

/**
 * DELETE: Soft Delete (Archive)
 * Marks user as deleted so data stays in DB for Admin but is hidden from app
 */
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    // 1. Find the student to get the linked userId
    const student = await prisma.student.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (permanent) {
      // HARD DELETE: Removes from database entirely
      await prisma.user.delete({
        where: { id: student.userId }
      });
    } else {
      // SOFT DELETE: Mark as deleted and deactivate
      await prisma.user.update({
        where: { id: student.userId },
        data: {
          isDeleted: true,
          isActive: false,
          deletedAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("DELETE_STUDENT_ERROR:", error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
