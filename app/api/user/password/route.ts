import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
