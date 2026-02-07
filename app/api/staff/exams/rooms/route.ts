import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET: Fetch all Exam Rooms
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Security: Only Staff/Admin
    if (!session || (session.user as any).role === 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const rooms = await prisma.examRoom.findMany({ 
      orderBy: { code: 'asc' } 
    });

    return NextResponse.json({ rooms });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

/**
 * POST: Create a new Exam Room
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, code, capacity } = await req.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
    }

    const room = await prisma.examRoom.create({
      data: { 
        name, 
        code: code.toUpperCase(), 
        capacity: parseInt(capacity) || 28 
      }
    });

    return NextResponse.json({ success: true, room });

  } catch (error) {
    console.error("CREATE_ROOM_ERROR:", error);
    return NextResponse.json({ error: 'Failed to create room. Code might be duplicate.' }, { status: 500 });
  }
}

/**
 * PATCH: Update an existing Exam Room
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, name, code, capacity } = await req.json();

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updatedRoom = await prisma.examRoom.update({
      where: { id },
      data: { 
        name: name || undefined, 
        code: code ? code.toUpperCase() : undefined, 
        capacity: capacity ? parseInt(capacity) : undefined 
      }
    });

    return NextResponse.json({ success: true, room: updatedRoom });

  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

/**
 * DELETE: Remove an Exam Room
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.examRoom.delete({ 
      where: { id } 
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    // Rooms with existing ExamRuns cannot be deleted unless the runs are deleted first
    return NextResponse.json({ error: 'Delete failed. Room may have active exam sessions.' }, { status: 500 });
  }
}
