import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { withAuth } from '@/app/lib/auth-helpers';

// POST: Allow a logged-in user to set or change their password
export async function POST(req: Request) {
  const { error, session } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  const { newPassword } = await req.json();

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  try {
    const hashedPassword = await hash(newPassword, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
