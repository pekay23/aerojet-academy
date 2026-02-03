import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch application details
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // Correct Next.js 15 Promise type
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Await the params promise to get the ID
  const { id } = await params;

  try {
    const application = await prisma.application.findUnique({
      where: { id },
      include: { course: true }
    });
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Fetch Application Error:", error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

// POST: Save/Submit detailed application
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Await the params promise to get the ID
  const { id } = await params;
  const body = await req.json();

  try {
    // 1. Get student profile and their fees
    const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        include: { fees: true }
    });

    if (!student) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // 2. Security Check: Find if the Registration Fee is PAID
    const regFee = student.fees.find(f => f.description?.includes("Registration Fee"));
    
    if (regFee?.status !== 'PAID') {
        return NextResponse.json({ 
            error: 'Registration fee must be verified by admin before submitting the full form.' 
        }, { status: 403 });
    }

    // 3. Update the Application with detailed info
    const application = await prisma.application.update({
      where: { id },
      data: {
        educationLevel: body.educationLevel,
        institutionName: body.institutionName,
        graduationYear: body.graduationYear,
        idDocumentUrl: body.idDocumentUrl,
        certificateUrl: body.certificateUrl,
        transcriptUrl: body.transcriptUrl,
        isSubmitted: true,
        status: 'UNDER_REVIEW' 
      }
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Application Submit Error:", error);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
