import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { withAuth } from '@/app/lib/auth-helpers';

// GET: Fetch Profile
export async function GET(req: Request) {
  const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;
  const userId = (session.user as any).id;

  const student = await prisma.student.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true, image: true } } }
  });

  return NextResponse.json({ student });
}

// PATCH: Update Profile (Phone, Password)
export async function PATCH(req: Request) {
  const { error, session } = await withAuth(['STUDENT']);
  if (error) return error;
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
