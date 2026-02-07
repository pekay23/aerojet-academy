import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define the type for our recipient
type Recipient = {
  email: string | null;
  name: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('target');

  try {
    // FIX: Explicitly type the array
    let users: Recipient[] = [];

    if (target === 'ALL_STUDENTS') {
      users = await prisma.user.findMany({ 
        where: { role: 'STUDENT', isDeleted: false }, 
        select: { email: true, name: true } 
      });
    } else if (target === 'INSTRUCTORS') {
      users = await prisma.user.findMany({ 
        where: { role: 'INSTRUCTOR', isDeleted: false }, 
        select: { email: true, name: true } 
      });
    } else if (target === 'STAFF') {
      users = await prisma.user.findMany({ 
        where: { role: 'STAFF', isDeleted: false }, 
        select: { email: true, name: true } 
      });
    }

    return NextResponse.json({ recipients: users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 });
  }
}
