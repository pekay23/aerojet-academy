import { NextResponse } from 'next/server';
import { sendRegistrationInvoiceEmail } from '@/app/lib/mail';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email, name } = await req.json();

  try {
    // 1. Create the user in database (Inactive)
    // ... insert prisma logic here ...

    // 2. Send the Invoice Email with bank details
    await sendRegistrationInvoiceEmail(email, name || 'Applicant');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
