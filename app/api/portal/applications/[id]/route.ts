import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch application details
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const application = await prisma.application.findUnique({
      where: { id },
      include: { course: true }
    });
    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST: Save/Submit detailed application
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    // Check if the Registration Fee is PAID before allowing submission
    const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        include: { fees: true }
    });

    const regFee = student?.fees.find(f => f.description?.includes("Registration Fee"));
    if (regFee?.status !== 'PAID') {
        return NextResponse.json({ error: 'Registration fee must be paid first.' }, { status: 403 });
    }

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
        status: 'UNDER_REVIEW' // Move status forward automatically
      }
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
