import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BUNDLES = {
  'BUNDLE_2': { name: '2-Exam Bundle', price: 980.00, credits: 2 },
  'BUNDLE_4': { name: '4-Exam Bundle', price: 1900.00, credits: 4 },
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bundleType } = await req.json(); // e.g. 'BUNDLE_4'
  const bundle = BUNDLES[bundleType as keyof typeof BUNDLES];

  if (!bundle) return NextResponse.json({ error: 'Invalid bundle' }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: 'Profile required' }, { status: 400 });

  // Create Invoice (Fee)
  // Note: description starts with "BUNDLE:" so we can detect it later during verification
  await prisma.fee.create({
    data: {
      studentId: student.id,
      amount: bundle.price,
      paid: 0,
      status: 'UNPAID',
      description: `BUNDLE: ${bundle.name} (${bundle.credits} Credits)`, 
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7))
    }
  });

  return NextResponse.json({ success: true });
}
