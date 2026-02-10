import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const student = await prisma.student.findUnique({ where: { userId } });

        if (!student) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        const body = await req.json();
        const { educationLevel, institutionName, idDocumentUrl, certificateUrl, program } = body;

        // 1. Find or Create Course based on program
        // For simplicity, we assume a "General Application" course or find specific one.
        // For now, let's look for a course that matches 'program' or fallback to a default placeholder.
        let course = await prisma.course.findFirst({
            where: { title: { contains: 'Aircraft Engineering', mode: 'insensitive' } } // Fallback
        });

        if (!course) {
            // Create a dummy course if not exists (should seed DB ideally)
            course = await prisma.course.create({
                data: {
                    code: 'AME-FULL',
                    title: 'Aircraft Maintenance Engineering (Full-Time)',
                    price: 2500.00, // Example tuition
                    duration: '4 Years'
                }
            });
        }

        // 2. Create Application Record
        const application = await prisma.application.create({
            data: {
                studentId: student.id,
                courseId: course.id,
                educationLevel,
                institutionName,
                idDocumentUrl,
                certificateUrl,
                isSubmitted: true,
                status: 'PENDING'
            }
        });

        // 3. Generate Seat Deposit Fee if Full-Time
        // Logic: 40% of Tuition
        if (program === 'Full-Time') {
            const tuition = Number(course.price) || 2500.00;
            const depositAmount = tuition * 0.40;

            await prisma.fee.create({
                data: {
                    studentId: student.id,
                    amount: depositAmount,
                    description: 'Seat Confirmation Deposit (40%)',
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks due
                    status: 'UNPAID'
                }
            });
        }

        return NextResponse.json({ success: true, applicationId: application.id });

    } catch (error) {
        console.error('Submit Application Error:', error);
        return NextResponse.json({ error: 'Application submission failed' }, { status: 500 });
    }
}
