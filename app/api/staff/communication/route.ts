import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to get emails based on target
async function getRecipients(type: string, id?: string) {
  if (type === 'ALL_STUDENTS') {
    return prisma.user.findMany({ where: { role: 'STUDENT', isActive: true }, select: { email: true, name: true } });
  }
  if (type === 'ALL_INSTRUCTORS') {
    return prisma.user.findMany({ where: { role: 'INSTRUCTOR', isActive: true }, select: { email: true, name: true } });
  }
  if (type === 'ALL_STAFF') {
    return prisma.user.findMany({ where: { role: { in: ['ADMIN', 'STAFF'] }, isActive: true }, select: { email: true, name: true } });
  }
  if (type === 'COURSE_STUDENTS' && id) {
    // Find students who have an APPROVED application for this course
    const apps = await prisma.application.findMany({
      where: { courseId: id, status: 'APPROVED' },
      include: { student: { include: { user: true } } }
    });
    return apps.map(app => app.student.user);
  }
  return [];
}

// GET: Count Recipients
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || '';
  const id = searchParams.get('id') || '';

  const recipients = await getRecipients(type, id);
  return NextResponse.json({ count: recipients.length });
}

// POST: Send Broadcast
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { targetType, targetId, subject, message } = await req.json();
  const recipients = await getRecipients(targetType, targetId);

  if (recipients.length === 0) return NextResponse.json({ error: 'No recipients' }, { status: 400 });

  // In production, batch this. For now, simple loop or bcc.
  // Using BCC to send one email to many (if supported) or individual loops.
  // Resend supports batching, but for simplicity here we will send individual emails
  // to ensure personalization "Dear Name".
  
  // Limit for safety in this demo
  const safeRecipients = recipients.slice(0, 50); 

  try {
    const emailPromises = safeRecipients.map(user => {
      if (!user.email) return Promise.resolve();
      return resend.emails.send({
        from: 'Aerojet Updates <updates@aerojet-academy.com>',
        to: user.email,
        subject: subject,
        html: `
          <p>Dear ${user.name || 'Student'},</p>
          <div style="white-space: pre-wrap;">${message}</div>
          <hr />
          <p style="font-size: 12px; color: #666;">You received this email because you are a member of Aerojet Aviation Academy.</p>
        `
      });
    });

    await Promise.all(emailPromises);
    
    return NextResponse.json({ success: true, count: safeRecipients.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
