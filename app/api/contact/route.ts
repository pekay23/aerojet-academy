import { NextResponse } from 'next/server';
import { sendEnquiryEmail, sendStaffNotification } from '@/app/lib/mail';

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    // 1. Send Auto-Response to the Student (Trust Building)
    await sendEnquiryEmail(email, name);

    // 2. Send Notification to your Microsoft Team Inbox
    await sendStaffNotification(name, email, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact Form Error:", error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
