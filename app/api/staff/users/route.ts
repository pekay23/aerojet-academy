import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// GET: List all users (for admin management)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { role: 'asc' } // Show Admins first
  });
  return NextResponse.json({ users });
}

// PATCH: Update user role
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { userId, role, image } = await req.json(); // Added image

  const dataToUpdate: any = {};
  if (role) dataToUpdate.role = role;
  if (image) dataToUpdate.image = image;

  await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate
  });

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { name, email, password, role } = await req.json();

  try {
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    });
    
    // If it's a student, create the profile too
    if (role === 'STUDENT') {
        await prisma.student.create({ data: { userId: user.id } });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'User already exists' }, { status: 500 });
  }
}