import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch the student profile linked to the logged-in user
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ student });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// POST: Create or Update the profile
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { 
    phone, dob, address, city, region, 
    emergencyName, emergencyRelation, emergencyPhone 
  } = body;

  try {
    const student = await prisma.student.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        phone,
        dob: dob ? new Date(dob) : null,
        address,
        city,
        region,
        emergencyName,
        emergencyRelation,
        emergencyPhone,
      },
      create: {
        userId: session.user.id,
        phone,
        dob: dob ? new Date(dob) : null,
        address,
        city,
        region,
        emergencyName,
        emergencyRelation,
        emergencyPhone,
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
