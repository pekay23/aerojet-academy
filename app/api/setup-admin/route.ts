import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const password = await hash('123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'floowdis@gmail.com' },
      update: {
        password: password,
        role: 'ADMIN',
        isActive: true
      },
      create: {
        email: 'floowdis@gmail.com',
        name: 'Super Admin',
        password: password,
        role: 'ADMIN',
        isActive: true,
      },
    });

    return NextResponse.json({ 
        success: true, 
        message: 'Admin setup complete. Login with floowdis@gmail.com / 123' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
