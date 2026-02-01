import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all courses
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const courses = await prisma.course.findMany({ orderBy: { code: 'asc' } });
  return NextResponse.json({ courses });
}

// PATCH: Update a course (e.g. set material link)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id, materialLink, price, title } = await req.json();

  try {
    await prisma.course.update({
        where: { id },
        data: { 
            materialLink,
            price: price ? parseFloat(price) : undefined,
            title
        }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
