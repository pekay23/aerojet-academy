import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch Rooms
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const rooms = await prisma.examRoom.findMany({ orderBy: { code: 'asc' } });
  return NextResponse.json({ rooms });
}

// POST: Create Room
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  try {
    const room = await prisma.examRoom.create({
        data: { name: body.name, code: body.code, capacity: parseInt(body.capacity) }
    });
    return NextResponse.json({ success: true, room });
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

// PATCH: Update Room
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id, name, code, capacity } = await req.json();
  try {
    await prisma.examRoom.update({
        where: { id },
        data: { name, code, capacity: parseInt(capacity) }
    });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: 'Update failed' }, { status: 500 }); }
}

// DELETE: Delete Room
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await req.json();
  try {
    await prisma.examRoom.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: 'Delete failed' }, { status: 500 }); }
}
