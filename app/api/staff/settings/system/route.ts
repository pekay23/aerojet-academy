import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

export async function GET() {
  const settings = await prisma.systemSetting.findMany();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { key, value } = await req.json();

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });

  return NextResponse.json({ success: true });
}
