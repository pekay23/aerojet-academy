import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all students
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const students = await prisma.student.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ students });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
