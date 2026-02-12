import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { withAuth } from '@/app/lib/auth-helpers';

type Recipient = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
};

export async function GET(req: Request) {
  const { error, session } = await withAuth(['ADMIN', 'STAFF']);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const target = searchParams.get('target');

  try {
    let users: Recipient[] = [];

    if (target === 'ALL_STUDENTS') {
      users = await prisma.user.findMany({
        where: { role: 'STUDENT', isDeleted: false, isActive: true },
        select: { id: true, email: true, name: true, role: true }
      });
    } else if (target === 'APPLICANTS') {
      users = await prisma.user.findMany({
        where: { role: 'STUDENT', isDeleted: false, studentProfile: { enrollmentStatus: { in: ['PROSPECT', 'APPLICANT'] } } },
        select: { id: true, email: true, name: true, role: true }
      });
    } else if (target === 'STAFF') {
      users = await prisma.user.findMany({
        where: { role: { in: ['STAFF', 'INSTRUCTOR', 'ADMIN'] }, isDeleted: false },
        select: { id: true, email: true, name: true, role: true }
      });
    } else {
      // Return all active users for custom selection
      users = await prisma.user.findMany({
        where: { isDeleted: false, isActive: true },
        select: { id: true, email: true, name: true, role: true },
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json({ recipients: users });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 });
  }
}
