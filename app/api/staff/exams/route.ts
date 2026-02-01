import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all exam runs (with booking counts)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const runs = await prisma.examRun.findMany({
      include: {
        course: true,
        room: true,
        bookings: { include: { student: { include: { user: true } } } }
      },
      orderBy: { startDatetime: 'desc' }
    });
    
    // Also fetch available rooms and modules for the "Create" form
    const rooms = await prisma.examRoom.findMany();
    const modules = await prisma.course.findMany({ where: { code: { startsWith: 'MOD-' } } });

    return NextResponse.json({ runs, rooms, modules });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST: Create a new Exam Run
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { moduleId, roomId, datetime, duration } = await req.json();

  try {
    // Basic validation: Check room capacity
    const room = await prisma.examRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const run = await prisma.examRun.create({
        data: {
            examModuleId: moduleId,
            roomId: roomId,
            startDatetime: new Date(datetime),
            durationMinutes: parseInt(duration),
            maxCapacity: room.capacity,
            status: 'SCHEDULED'
        }
    });

    return NextResponse.json({ success: true, run });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create run' }, { status: 500 });
  }
}
