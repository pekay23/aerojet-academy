import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// GET: Fetch Profile
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const student = await prisma.student.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true, image: true } } }
  });

  return NextResponse.json({ student });
}

// PATCH: Update Profile (Phone, Password)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const { phone, password } = await req.json();

  try {
    await prisma.$transaction(async (tx) => {
        if (phone) {
            await tx.student.update({ where: { userId }, data: { phone } });
        }
        if (password) {
            const hashedPassword = await hash(password, 10);
            await tx.user.update({ where: { id: userId }, data: { password: hashedPassword } });
        }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
