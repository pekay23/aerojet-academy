import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { withAuth } from '@/app/lib/auth-helpers';

export async function POST(req: Request) {
  const { error, session } = await withAuth();
  if (error) return error;

  try {
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hash(newPassword, 10);

    // Update the USER record (not student)
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id }, // Ensure this ID is correct from session
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
